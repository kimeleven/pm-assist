"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { STATUS_LABELS } from "@/lib/utils";
import { ReportStatus } from "@prisma/client";

interface StatsData {
  total: number;
  completionRate: number;
  byStatus: { status: ReportStatus; count: number }[];
  byCompany: { companyId: string; companyName: string; count: number }[];
  daily: { date: string; count: number }[];
}

const PIE_COLORS = ["#3B82F6", "#EAB308", "#22C55E", "#6B7280", "#EF4444"];

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400">로딩 중...</div>;
  if (!stats) return <div className="p-6 text-center text-red-400">데이터를 불러올 수 없습니다.</div>;

  const pieData = stats.byStatus.map((s) => ({
    name: STATUS_LABELS[s.status],
    value: s.count,
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">통계 대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">전체 신고</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-1">건</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">처리율</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.completionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">완료 기준</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">등록 업체</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">{stats.byCompany.length}</p>
          <p className="text-xs text-gray-400 mt-1">개</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 일별 신고 건수 */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-800 mb-4">최근 7일 신고 건수</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="신고 건수" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 상태별 분포 */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-800 mb-4">상태별 분포</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 업체별 신고 건수 */}
        <div className="bg-white rounded-xl shadow p-5 col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">업체별 신고 현황</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.byCompany} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="companyName" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" name="신고 건수" fill="#22C55E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
