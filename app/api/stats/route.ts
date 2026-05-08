import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const [total, byStatus, byCompany, recent7days] = await Promise.all([
    prisma.report.count(),
    prisma.report.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.report.groupBy({
      by: ["companyId"],
      _count: { companyId: true },
      orderBy: { _count: { companyId: "desc" } },
    }),
    // 최근 7일 일별 건수
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(reported_at)::text AS date, COUNT(*)::bigint AS count
      FROM "Report"
      WHERE reported_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(reported_at)
      ORDER BY date ASC
    `,
  ]);

  // 처리율
  const completed = byStatus
    .filter((s) => ["FIXED", "TOWED", "NOT_FOUND"].includes(s.status))
    .reduce((sum, s) => sum + s._count.status, 0);

  const companyIds = byCompany.map((b) => b.companyId);
  const companies = await prisma.company.findMany({
    where: { id: { in: companyIds } },
    select: { id: true, name: true },
  });
  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));

  return NextResponse.json({
    total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
    byCompany: byCompany.map((b) => ({
      companyId: b.companyId,
      companyName: companyMap[b.companyId] ?? "알 수 없음",
      count: b._count.companyId,
    })),
    daily: recent7days.map((r) => ({ date: r.date, count: Number(r.count) })),
  });
}
