import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      users: { select: { id: true, username: true, role: true } },
      _count: { select: { devices: true, reports: true } },
    },
  });

  if (!company) return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(company);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await req.json();
  const { name, contact, address, status } = body;

  // status 변경 시 유효성 검사
  if (status !== undefined && !["active", "inactive"].includes(status)) {
    return NextResponse.json({ error: "유효하지 않은 상태값입니다." }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (contact !== undefined) updateData.contact = contact;
  if (address !== undefined) updateData.address = address;
  if (status !== undefined) updateData.status = status;

  const company = await prisma.company.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(company);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  // 연결된 신고가 있으면 삭제 불가
  const reportCount = await prisma.report.count({ where: { companyId: params.id } });
  if (reportCount > 0) {
    return NextResponse.json(
      { error: `신고 내역이 ${reportCount}건 있어 삭제할 수 없습니다. 비활성화를 이용하세요.` },
      { status: 409 }
    );
  }

  await prisma.company.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
