import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, setCookieHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { company: { select: { id: true, name: true } } },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    companyId: user.companyId,
  });

  const redirectTo = user.role === "ADMIN" ? "/admin/dashboard" : "/company/dashboard";

  return NextResponse.json(
    { role: user.role, redirectTo, company: user.company },
    {
      status: 200,
      headers: { "Set-Cookie": setCookieHeader(token) },
    }
  );
}
