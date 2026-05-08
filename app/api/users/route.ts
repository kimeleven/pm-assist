import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const users = await prisma.user.findMany({
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users.map(({ passwordHash: _, ...u }) => u));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { username, password, role, companyId } = await req.json();
  if (!username || !password || !role) {
    return NextResponse.json({ error: "아이디, 비밀번호, 역할은 필수입니다." }, { status: 400 });
  }
  if (!["ADMIN", "COMPANY"].includes(role)) {
    return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, passwordHash, role: role as Role, companyId: companyId || null },
  });

  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe, { status: 201 });
}
