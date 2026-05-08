"use client";

import { useState } from "react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { ReportStatus } from "@prisma/client";

interface Report {
  id: string;
  violationType: string;
  status: ReportStatus;
  reportedAt: string;
  company: { name: string };
  actionResult?: string;
  actionAt?: string;
}

export default function MyReportsPage() {
  const [phone, setPhone] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/reports?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    setReports(Array.isArray(data) ? data : []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-2xl">
          <h1 className="text-lg font-bold">📋 나의 신고 현황</h1>
        </div>

        <div className="bg-white shadow-md rounded-b-2xl p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="tel"
              placeholder="신고 시 입력한 연락처"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              조회
            </button>
          </form>

          {searched && reports.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">신고 내역이 없습니다.</p>
          )}

          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.violationType}</p>
                    <p className="text-xs text-gray-500">{r.company?.name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  신고: {new Date(r.reportedAt).toLocaleString("ko-KR")}
                </p>
                {r.actionAt && (
                  <p className="text-xs text-gray-400">
                    처리: {new Date(r.actionAt).toLocaleString("ko-KR")} ({r.actionResult})
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <a href="/report" className="text-sm text-blue-600 underline">
              새 신고 접수
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
