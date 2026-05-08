import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      device: true,
    },
  });
  if (!report) return NextResponse.json({ error: "신고를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(report);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const body = await req.json();
  const report = await prisma.report.update({
    where: { id: params.id },
    data: { ...body, updatedAt: new Date() },
  });

  return NextResponse.json(report);
}
