"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { isOverGrace, STATUS_LABELS } from "@/lib/utils";
import { METROPOLITAN_AREAS, DISTRICTS, type MetropolitanArea } from "@/lib/regions";
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
  device?: { model: string };
}

interface SelectedReport {
  id: string;
  violationType: string;
  status: ReportStatus;
  reportedAt: string;
  company: { name: string };
  device?: { model: string };
}

interface Company {
  id: string;
  name: string;
}

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [metropolitanFilter, setMetropolitanFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [selected, setSelected] = useState<SelectedReport | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCompanies(data));
  }, []);

  const fetchReports = useCallback(async (companyId?: string, metropolitan?: string, district?: string) => {
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    if (metropolitan) params.set("metropolitan", metropolitan);
    if (district) params.set("district", district);
    const qs = params.toString();
    const res = await fetch(`/api/reports-map${qs ? `?${qs}` : ""}`);
    if (res.ok) {
      const data = await res.json();
      setReports(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports(companyFilter || undefined, metropolitanFilter || undefined, districtFilter || undefined);
    const interval = setInterval(
      () => fetchReports(companyFilter || undefined, metropolitanFilter || undefined, districtFilter || undefined),
      30000
    );
    return () => clearInterval(interval);
  }, [fetchReports, companyFilter, metropolitanFilter, districtFilter]);

  const markers: MapMarker[] = reports.map((r) => ({
    id: r.id,
    lat: r.locationLat,
    lng: r.locationLng,
    isOverGrace: isOverGrace(r.gracePeriodEnd),
    label: `${r.company.name}`,
    detail: `${r.violationType} | ${new Date(r.reportedAt).toLocaleTimeString("ko-KR")}`,
  }));

  function handleMarkerClick(id: string) {
    const r = reports.find((rep) => rep.id === id);
    if (r) setSelected(r);
  }

  function handleMetroChange(val: string) {
    setMetropolitanFilter(val);
    setDistrictFilter("");
    setSelected(null);
  }

  async function handleAction(actionResult: "FIXED" | "TOWED" | "NOT_FOUND") {
    if (!selected) return;
    setProcessing(true);
    await fetch(`/api/reports/${selected.id}/action`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionResult }),
    });
    setSelected(null);
    await fetchReports(companyFilter || undefined, metropolitanFilter || undefined, districtFilter || undefined);
    setProcessing(false);
  }

  const overGraceCount = reports.filter((r) => isOverGrace(r.gracePeriodEnd)).length;
  const activeCount = reports.filter((r) => !isOverGrace(r.gracePeriodEnd)).length;

  return (
    <div className="flex flex-col h-screen">
      {/* 상단 상태 바 */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-6 flex-wrap">
        <h1 className="text-base font-bold text-gray-800">지도 모니터링</h1>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            유예초과 <strong>{overGraceCount}</strong>건
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            유예중 <strong>{activeCount}</strong>건
          </span>
        </div>
        {/* 업체 필터 */}
        <select
          value={companyFilter}
          onChange={(e) => { setCompanyFilter(e.target.value); setSelected(null); }}
          className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">전체 업체</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {/* 광역지자체 필터 */}
        <select
          value={metropolitanFilter}
          onChange={(e) => handleMetroChange(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">전체 지역</option>
          {METROPOLITAN_AREAS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {/* 기초지자체 필터 — 광역 선택 시만 활성 */}
        <select
          value={districtFilter}
          onChange={(e) => { setDistrictFilter(e.target.value); setSelected(null); }}
          disabled={!metropolitanFilter}
          className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="">전체 시군구</option>
          {metropolitanFilter && DISTRICTS[metropolitanFilter as MetropolitanArea]?.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button
          onClick={() => fetchReports(companyFilter || undefined, metropolitanFilter || undefined, districtFilter || undefined)}
          className="ml-auto text-xs text-blue-600 border border-blue-400 rounded px-3 py-1 hover:bg-blue-50"
        >
          새로고침
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 지도 */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              지도 로딩 중...
            </div>
          ) : (
            <KakaoMap markers={markers} onMarkerClick={handleMarkerClick} />
          )}
        </div>

        {/* 선택된 신고 상세 패널 */}
        {selected && (
          <div className="w-72 bg-white border-l shadow-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-gray-800">신고 상세</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">
                ×
              </button>
            </div>

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
                  <span className="text-gray-500">기기모델</span>
                  <span className="font-medium">{selected.device.model}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">상태</span>
                <span className="font-medium">{STATUS_LABELS[selected.status]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">신고시간</span>
                <span className="text-xs">{new Date(selected.reportedAt).toLocaleString("ko-KR")}</span>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">직권 처리</p>
              <button
                onClick={() => handleAction("FIXED")}
                disabled={processing}
                className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                정비완료
              </button>
              <button
                onClick={() => handleAction("TOWED")}
                disabled={processing}
                className="w-full bg-gray-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
              >
                견인완료
              </button>
              <button
                onClick={() => handleAction("NOT_FOUND")}
                disabled={processing}
                className="w-full bg-red-100 text-red-700 rounded-lg py-2 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
              >
                기기 미발견
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
