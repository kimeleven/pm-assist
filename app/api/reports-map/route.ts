import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const where: Record<string, unknown> = {
    status: { in: ["RECEIVED", "GRACE"] },
  };
  if (session.role === "COMPANY") where.companyId = session.companyId;

  const reports = await prisma.report.findMany({
    where,
    select: {
      id: true,
      locationLat: true,
      locationLng: true,
      gracePeriodEnd: true,
      status: true,
      violationType: true,
      reportedAt: true,
      company: { select: { name: true } },
      device: { select: { model: true } },
    },
  });

  return NextResponse.json(reports);
}
