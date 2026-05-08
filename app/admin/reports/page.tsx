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
  photoUrl: string;
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

const ACTION_RESULTS: { value: "FIXED" | "TOWED" | "NOT_FOUND"; label: string; color: string }[] = [
  { value: "FIXED", label: "정비완료", color: "bg-green-600 hover:bg-green-700" },
  { value: "TOWED", label: "견인완료", color: "bg-gray-600 hover:bg-gray-700" },
  { value: "NOT_FOUND", label: "기기미발견", color: "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200" },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionNote, setActionNote] = useState("");

  function fetchReports(filter: string) {
    const url = filter ? `/api/reports?status=${filter}` : "/api/reports";
    setLoading(true);
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setReports(data); setLoading(false); });
  }

  useEffect(() => { fetchReports(statusFilter); }, [statusFilter]);

  async function handleAction(actionResult: "FIXED" | "TOWED" | "NOT_FOUND") {
    if (!selected) return;
    setProcessing(true);
    await fetch(`/api/reports/${selected.id}/action`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionResult, actionNote }),
    });
    setSelected(null);
    setActionNote("");
    fetchReports(statusFilter);
    setProcessing(false);
  }

  const isPending = selected && (selected.status === "RECEIVED" || selected.status === "GRACE");

  return (
    <div className="p-6 flex gap-6 h-full">
      {/* 목록 영역 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">신고 현황 관리</h1>
          <div className="flex gap-2 flex-wrap">
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
                  <tr
                    key={r.id}
                    onClick={() => { setSelected(r); setActionNote(""); }}
                    className={`hover:bg-gray-50 cursor-pointer ${selected?.id === r.id ? "bg-blue-50" : ""}`}
                  >
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

      {/* 상세/처리 패널 */}
      {selected && (
        <div className="w-72 flex-shrink-0 bg-white rounded-xl shadow p-5 space-y-4 self-start">
          <div className="flex items-start justify-between">
            <h2 className="font-semibold text-gray-800">신고 상세</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          {/* 사진 */}
          {selected.photoUrl && (
            <img src={selected.photoUrl} alt="신고 사진" className="w-full h-32 object-cover rounded-lg border" />
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">업체</span>
              <span className="font-medium">{selected.company.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">위반유형</span>
              <span className="font-medium">{selected.violationType}</span>
            </div>
            {selected.device && (
              <div className="flex justify-between">
                <span className="text-gray-500">기기</span>
                <span className="font-medium text-xs">{selected.device.model}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">상태</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </span>
            </div>
            {selected.locationAddr && (
              <div>
                <span className="text-gray-500 text-xs">{selected.locationAddr}</span>
              </div>
            )}
            <div className="text-xs text-gray-400">
              {new Date(selected.reportedAt).toLocaleString("ko-KR")}
            </div>
          </div>

          {isPending && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600">직권 처리</p>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={2}
                placeholder="처리 메모 (선택)"
                className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {ACTION_RESULTS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => handleAction(a.value)}
                  disabled={processing}
                  className={`w-full text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
