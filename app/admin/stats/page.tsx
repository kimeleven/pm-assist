"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { STATUS_LABELS } from "@/lib/utils";
import { ReportStatus } from "@prisma/client";

interface StatsData {
  total: number;
  completionRate: number;
  byStatus: { status: ReportStatus; count: number }[];
  byCompany: { companyId: string; companyName: string; count: number }[];
  periodData: { date: string; count: number }[];
  period: "daily" | "weekly" | "monthly";
  companyId: string | null;
}

interface Company {
  id: string;
  name: string;
}

const PIE_COLORS = ["#3B82F6", "#EAB308", "#22C55E", "#6B7280", "#EF4444"];

const PERIOD_OPTIONS = [
  { value: "daily",   label: "일별 (7일)" },
  { value: "weekly",  label: "주별 (12주)" },
  { value: "monthly", label: "월별 (12개월)" },
] as const;

const PERIOD_CHART_LABEL: Record<string, string> = {
  daily:   "일별 신고 건수",
  weekly:  "주별 신고 건수",
  monthly: "월별 신고 건수",
};

export default function AdminStatsPage() {
  const [stats, setStats]             = useState<StatsData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [companies, setCompanies]     = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [period, setPeriod]           = useState<"daily" | "weekly" | "monthly">("daily");

  // 업체 목록 로드 (최초 1회)
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d: Company[]) => setCompanies(d))
      .catch(() => {});
  }, []);

  // 통계 데이터 로드 (필터 변경 시마다)
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (selectedCompany) params.set("companyId", selectedCompany);

    fetch(`/api/stats?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedCompany, period]);

  const pieData = stats?.byStatus.map((s) => ({
    name: STATUS_LABELS[s.status],
    value: s.count,
  })) ?? [];

  const selectedCompanyName =
    companies.find((c) => c.id === selectedCompany)?.name ?? "전체";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">통계 대시보드</h1>

        {/* 필터 영역 */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 업체 선택 */}
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">전체 업체</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* 기간 탭 */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  period === opt.value
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 현재 필터 표시 */}
      {(selectedCompany || period !== "daily") && (
        <p className="text-sm text-gray-500">
          📊 <span className="font-medium text-blue-600">{selectedCompanyName}</span>
          {" — "}
          <span className="font-medium text-blue-600">{PERIOD_OPTIONS.find((o) => o.value === period)?.label}</span>
          &nbsp;기준
        </p>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400">로딩 중...</div>
      ) : !stats ? (
        <div className="py-16 text-center text-red-400">데이터를 불러올 수 없습니다.</div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">신고 합계</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">{selectedCompanyName}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">처리율</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completionRate}%</p>
              <p className="text-xs text-gray-400 mt-1">완료 기준</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">집계 업체 수</p>
              <p className="text-3xl font-bold text-gray-700 mt-1">{stats.byCompany.length}</p>
              <p className="text-xs text-gray-400 mt-1">개</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 기간별 신고 건수 차트 */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold text-gray-800 mb-4">
                {PERIOD_CHART_LABEL[period]}
                {selectedCompany && (
                  <span className="ml-2 text-sm font-normal text-blue-500">({selectedCompanyName})</span>
                )}
              </h2>
              {stats.periodData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => {
                        if (period === "monthly") return v.slice(0, 7);
                        if (period === "weekly") return v.slice(5); // MM-DD
                        return v.slice(5); // MM-DD
                      }}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(v) => {
                        if (period === "weekly") return `주 시작일: ${v}`;
                        if (period === "monthly") return `월: ${v}`;
                        return `날짜: ${v}`;
                      }}
                    />
                    <Bar dataKey="count" name="신고 건수" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 상태별 분포 */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold text-gray-800 mb-4">
                상태별 분포
                {selectedCompany && (
                  <span className="ml-2 text-sm font-normal text-blue-500">({selectedCompanyName})</span>
                )}
              </h2>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 업체별 신고 건수 */}
            <div className="bg-white rounded-xl shadow p-5 col-span-2">
              <h2 className="font-semibold text-gray-800 mb-4">
                업체별 신고 현황
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({PERIOD_OPTIONS.find((o) => o.value === period)?.label} 기간 내)
                </span>
              </h2>
              {stats.byCompany.length === 0 ? (
                <div className="flex items-center justify-center h-[120px] text-gray-400 text-sm">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(120, stats.byCompany.length * 45)}>
                  <BarChart data={stats.byCompany} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="companyName" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" name="신고 건수" fill="#22C55E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
