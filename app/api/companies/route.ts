import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await getSession();

  // ADMIN: 전체 정보 + counts (관리자 화면용)
  if (session?.role === "ADMIN") {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { users: true, devices: true, reports: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(companies);
  }

  // 비로그인/일반: id + name + status 만 (시민 신고 화면 드롭다운용)
  const companies = await prisma.company.findMany({
    where: { status: "active" },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { name, contact, address } = await req.json();
  if (!name || !contact) return NextResponse.json({ error: "업체명과 연락처는 필수입니다." }, { status: 400 });

  const company = await prisma.company.create({ data: { name, contact, address } });
  return NextResponse.json(company, { status: 201 });
}
