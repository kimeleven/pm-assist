"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { isOverGrace, STATUS_LABELS } from "@/lib/utils";
import type { MapMarker } from "@/components/map/KakaoMap";
import { ReportStatus } from "@prisma/client";

const KakaoMap = dynamic(() => import("@/components/map/KakaoMap"), { ssr: false });

interface MapReport {
  id: string;
  locationLat: number;
  locationLng: number;
  gracePeriodEnd: string;
  status: ReportStatus;
  violationType: string;
  reportedAt: string;
  company: { name: string };
}

export default function CompanyDashboardPage() {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    const res = await fetch("/api/reports-map");
    if (res.ok) setReports(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
    const iv = setInterval(fetchReports, 30000);
    return () => clearInterval(iv);
  }, [fetchReports]);

  const markers: MapMarker[] = reports.map((r) => ({
    id: r.id,
    lat: r.locationLat,
    lng: r.locationLng,
    isOverGrace: isOverGrace(r.gracePeriodEnd),
    label: r.violationType,
    detail: new Date(r.reportedAt).toLocaleTimeString("ko-KR"),
  }));

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <h1 className="text-base font-bold text-gray-800">신고 현황 지도</h1>
        <span className="text-sm text-gray-500">자사 신고 건만 표시됩니다</span>
        <span className="ml-auto text-sm font-semibold text-blue-600">{reports.length}건</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">로딩 중...</div>
          ) : (
            <KakaoMap markers={markers} />
          )}
        </div>

        <div className="w-64 bg-white border-l overflow-y-auto">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold text-gray-600">신고 목록</p>
          </div>
          {reports.map((r) => (
            <div key={r.id} className={`px-4 py-3 border-b text-xs ${isOverGrace(r.gracePeriodEnd) ? "bg-red-50" : ""}`}>
              <p className="font-semibold text-gray-800">{r.violationType}</p>
              <p className="text-gray-400 mt-0.5">{new Date(r.reportedAt).toLocaleString("ko-KR")}</p>
              <p className={`mt-1 font-medium ${isOverGrace(r.gracePeriodEnd) ? "text-red-600" : "text-green-600"}`}>
                {isOverGrace(r.gracePeriodEnd) ? "⚠ 유예초과" : "✅ 유예중"}
              </p>
              <a
                href="/company/reports"
                className="mt-1 inline-block text-blue-600 underline"
              >
                조치결과 등록
              </a>
            </div>
          ))}
          {reports.length === 0 && (
            <p className="text-center text-gray-400 text-xs py-8">신고 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}
