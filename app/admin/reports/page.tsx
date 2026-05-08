"use client";

import { useEffect, useState } from "react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { ReportStatus } from "@prisma/client";

interface Report {
  id: string;
  violationType: string;
  status: ReportStatus;
  reportedAt: string;
  reporterPhone: string;
  locationAddr?: string;
  company: { name: string };
  device?: { model: string; qrCode: string };
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "전체" },
  { value: "RECEIVED", label: "접수" },
  { value: "GRACE", label: "유예중" },
  { value: "FIXED", label: "정비완료" },
  { value: "TOWED", label: "견인완료" },
  { value: "NOT_FOUND", label: "기기미발견" },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const url = statusFilter ? `/api/reports?status=${statusFilter}` : "/api/reports";
    setLoading(true);
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setReports(data); setLoading(false); });
  }, [statusFilter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">신고 현황 관리</h1>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-600 hover:border-blue-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">로딩 중...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">신고시간</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">업체</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">위반유형</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">기기</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">신고자</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-10">
                    신고 내역이 없습니다.
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(r.reportedAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 font-medium">{r.company.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.violationType}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.device?.model ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.reporterPhone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
