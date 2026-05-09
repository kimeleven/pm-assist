import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { company: { select: { id: true, name: true } } },
  });

  if (!user) return NextResponse.json({ error: "계정을 찾을 수 없습니다." }, { status: 404 });
  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await req.json();
  const { password, companyId, role } = body;

  const updateData: Record<string, unknown> = {};

  if (password !== undefined) {
    if (password.length < 6) {
      return NextResponse.json({ error: "비밀번호는 최소 6자 이상이어야 합니다." }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }
  if (companyId !== undefined) updateData.companyId = companyId || null;
  if (role !== undefined) {
    if (!["ADMIN", "COMPANY"].includes(role)) {
      return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
    }
    updateData.role = role;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
  });

  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  // 본인 계정 삭제 방지
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "계정을 찾을 수 없습니다." }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
