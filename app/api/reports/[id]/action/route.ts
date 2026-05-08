import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReportStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { actionResult, actionPhotoUrl, actionNote } = await req.json();

  const validResults: Record<string, ReportStatus> = {
    FIXED: "FIXED",
    TOWED: "TOWED",
    NOT_FOUND: "NOT_FOUND",
  };

  if (!validResults[actionResult]) {
    return NextResponse.json({ error: "유효하지 않은 처리 결과입니다." }, { status: 400 });
  }

  // PM업체는 자사 신고만 처리 가능
  if (session.role === "COMPANY") {
    const report = await prisma.report.findUnique({ where: { id: params.id } });
    if (!report || report.companyId !== session.companyId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
  }

  const updated = await prisma.report.update({
    where: { id: params.id },
    data: {
      status: validResults[actionResult],
      actionResult,
      actionPhotoUrl: actionPhotoUrl ?? null,
      actionNote: actionNote ?? null,
      actionAt: new Date(),
      actionUserId: session.userId,
    },
  });

  return NextResponse.json(updated);
}
