import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { GRACE_PERIOD_MINUTES } from "@/lib/utils";
import { ReportStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  // 인증 없이 phone 기반 조회는 허용 (시민 나의 신고 조회)
  if (!session && !phone) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  // GRACE 자동 전환: gracePeriodEnd 지난 RECEIVED 건을 GRACE로 일괄 처리
  if (session) {
    await prisma.report.updateMany({
      where: {
        status: ReportStatus.RECEIVED,
        gracePeriodEnd: { lt: new Date() },
      },
      data: { status: ReportStatus.GRACE },
    }).catch(() => {});
  }
  const status = searchParams.get("status") as ReportStatus | null;
  const companyId = searchParams.get("companyId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // 시민용: 연락처 기반 조회
  if (phone) {
    const reports = await prisma.report.findMany({
      where: { reporterPhone: phone },
      include: { company: { select: { name: true } }, device: { select: { model: true, qrCode: true } } },
      orderBy: { reportedAt: "desc" },
    });
    return NextResponse.json(reports);
  }

  // 관리자: 전체 / PM업체: 자사만
  // (위 phone 분기에서 return하지 않았으면 session은 보장됨)
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  const where: Record<string, unknown> = {};
  if (session.role === "COMPANY") where.companyId = session.companyId;
  if (companyId && session.role === "ADMIN") where.companyId = companyId;
  if (status) where.status = status;
  if (from || to) {
    where.reportedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const reports = await prisma.report.findMany({
    where,
    include: {
      company: { select: { name: true } },
      device: { select: { model: true, qrCode: true } },
    },
    orderBy: { reportedAt: "desc" },
    take: 200,
  });

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reporterPhone, qrCode, companyId, violationType, locationLat, locationLng, locationAddr, photoUrl } = body;

  if (!reporterPhone || !companyId || !violationType || !locationLat || !locationLng || !photoUrl) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  // 1인 1일 신고 제한 (SFR-003)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await prisma.report.count({
    where: { reporterPhone, reportedAt: { gte: todayStart } },
  });
  if (todayCount >= 5) {
    return NextResponse.json({ error: "1일 최대 5건까지 신고 가능합니다." }, { status: 429 });
  }

  let deviceId: string | null = null;
  if (qrCode) {
    const device = await prisma.device.findUnique({ where: { qrCode } });
    if (device) deviceId = device.id;
  }

  const gracePeriodEnd = new Date(Date.now() + GRACE_PERIOD_MINUTES * 60 * 1000);

  const report = await prisma.report.create({
    data: {
      reporterPhone,
      deviceId,
      companyId,
      violationType,
      locationLat,
      locationLng,
      locationAddr,
      photoUrl,
      gracePeriodEnd,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
