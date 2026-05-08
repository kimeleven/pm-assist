import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const qrCode = searchParams.get("qrCode");

  if (qrCode) {
    const device = await prisma.device.findUnique({
      where: { qrCode },
      include: { company: { select: { id: true, name: true } } },
    });
    return NextResponse.json(device);
  }

  const devices = await prisma.device.findMany({
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(devices);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { qrCode, companyId, model } = await req.json();
  if (!qrCode || !companyId || !model) {
    return NextResponse.json({ error: "QR코드, 업체, 모델명은 필수입니다." }, { status: 400 });
  }

  const device = await prisma.device.create({ data: { qrCode, companyId, model } });
  return NextResponse.json(device, { status: 201 });
}
