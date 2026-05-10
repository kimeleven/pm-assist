import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId") || undefined;
  const period = (searchParams.get("period") as "daily" | "weekly" | "monthly") || "daily";

  const where = companyId ? { companyId } : {};

  // 기간별 raw query (companyId 유무로 분기)
  type PeriodRow = { date: string; count: bigint };
  let periodQuery: PeriodRow[];

  if (period === "weekly") {
    periodQuery = companyId
      ? await prisma.$queryRaw<PeriodRow[]>`
          SELECT TO_CHAR(DATE_TRUNC('week', reported_at), 'YYYY-MM-DD') AS date,
                 COUNT(*)::bigint AS count
          FROM "Report"
          WHERE reported_at >= NOW() - INTERVAL '12 weeks'
            AND "companyId" = ${companyId}
          GROUP BY DATE_TRUNC('week', reported_at)
          ORDER BY date ASC`
      : await prisma.$queryRaw<PeriodRow[]>`
          SELECT TO_CHAR(DATE_TRUNC('week', reported_at), 'YYYY-MM-DD') AS date,
                 COUNT(*)::bigint AS count
          FROM "Report"
          WHERE reported_at >= NOW() - INTERVAL '12 weeks'
          GROUP BY DATE_TRUNC('week', reported_at)
          ORDER BY date ASC`;
  } else if (period === "monthly") {
    periodQuery = companyId
      ? await prisma.$queryRaw<PeriodRow[]>`
          SELECT TO_CHAR(DATE_TRUNC('month', reported_at), 'YYYY-MM') AS date,
                 COUNT(*)::bigint AS count
          FROM "Report"
          WHERE reported_at >= NOW() - INTERVAL '12 months'
            AND "companyId" = ${companyId}
          GROUP BY DATE_TRUNC('month', reported_at)
          ORDER BY date ASC`
      : await prisma.$queryRaw<PeriodRow[]>`
          SELECT TO_CHAR(DATE_TRUNC('month', reported_at), 'YYYY-MM') AS date,
                 COUNT(*)::bigint AS count
          FROM "Report"
          WHERE reported_at >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', reported_at)
          ORDER BY date ASC`;
  } else {
    // daily (default, 최근 7일)
    periodQuery = companyId
      ? await prisma.$queryRaw<PeriodRow[]>`
          SELECT DATE(reported_at)::text AS date,
                 COUNT(*)::bigint AS count
          FROM "Report"
          WHERE reported_at >= NOW() - INTERVAL '7 days'
            AND "companyId" = ${companyId}
          GROUP BY DATE(reported_at)
          ORDER BY date ASC`
      : await prisma.$queryRaw<PeriodRow[]>`
          SELECT DATE(reported_at)::text AS date,
                 COUNT(*)::bigint AS count
          FROM "Report"
          WHERE reported_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(reported_at)
          ORDER BY date ASC`;
  }

  const [total, byStatus, byCompanyRaw] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.groupBy({ by: ["status"], where, _count: { status: true } }),
    prisma.report.groupBy({
      by: ["companyId"],
      where,
      _count: { companyId: true },
      orderBy: { _count: { companyId: "desc" } },
    }),
  ]);

  const completed = byStatus
    .filter((s) => ["FIXED", "TOWED", "NOT_FOUND"].includes(s.status))
    .reduce((sum, s) => sum + s._count.status, 0);

  const companyIds = byCompanyRaw.map((b) => b.companyId);
  const companies = await prisma.company.findMany({
    where: { id: { in: companyIds } },
    select: { id: true, name: true },
  });
  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));

  return NextResponse.json({
    total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
    byCompany: byCompanyRaw.map((b) => ({
      companyId: b.companyId,
      companyName: companyMap[b.companyId] ?? "알 수 없음",
      count: b._count.companyId,
    })),
    periodData: periodQuery.map((r) => ({ date: r.date, count: Number(r.count) })),
    period,
    companyId: companyId ?? null,
  });
}
