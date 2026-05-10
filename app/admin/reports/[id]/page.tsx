"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { ReportStatus } from "@prisma/client";

interface ReportDetail {
  id: string;
  violationType: string;
  status: ReportStatus;
  reportedAt: string;
  reporterPhone: string;
  locationLat: number;
  locationLng: number;
  locationAddr?: string;
  photoUrl: string;
  actionPhotoUrl?: string;
  actionResult?: string;
  actionNote?: string;
  actionAt?: string;
  gracePeriodEnd: string;
  company: { id: string; name: string; contact: string };
  device?: { id: string; model: string; qrCode: string };
}

const ACTION_RESULTS: { value: "FIXED" | "TOWED" | "NOT_FOUND"; label: string; color: string }[] = [
  { value: "FIXED", label: "정비완료", color: "bg-green-600 hover:bg-green-700 text-white" },
  { value: "TOWED", label: "견인완료", color: "bg-gray-600 hover:bg-gray-700 text-white" },
  { value: "NOT_FOUND", label: "기기미발견", color: "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200" },
];

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [photoLarge, setPhotoLarge] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setReport(data); setLoading(false); });
  }, [id]);

  async function handleAction(actionResult: "FIXED" | "TOWED" | "NOT_FOUND") {
    if (!report) return;
    setProcessing(true);
    const res = await fetch(`/api/reports/${id}/action`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionResult, actionNote }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReport((prev) => prev ? { ...prev, ...updated } : prev);
      setActionNote("");
    }
    setProcessing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-400">
        로딩 중...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">신고를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-blue-600 underline text-sm">
          돌아가기
        </button>
      </div>
    );
  }

  const isPending = report.status === "RECEIVED" || report.status === "GRACE";
  const gracePeriodEnd = new Date(report.gracePeriodEnd);
  const isGraceExpired = gracePeriodEnd < new Date();
  const mapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(report.locationAddr || "신고위치")},${report.locationLat},${report.locationLng}`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
        >
          ← 목록
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex-1">신고 상세</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[report.status]}`}>
          {STATUS_LABELS[report.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 좌측: 사진 + 위치 */}
        <div className="space-y-4">
          {/* 신고 사진 */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">신고 사진</h2>
            </div>
            <div className="p-4">
              {report.photoUrl ? (
                <div className="relative">
                  <img
                    src={report.photoUrl}
                    alt="신고 사진"
                    className="w-full rounded-lg cursor-zoom-in object-cover"
                    style={{ maxHeight: photoLarge ? "none" : "240px" }}
                    onClick={() => setPhotoLarge(!photoLarge)}
                  />
                  <button
                    onClick={() => setPhotoLarge(!photoLarge)}
                    className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md hover:bg-black/70"
                  >
                    {photoLarge ? "축소" : "크게 보기"}
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8 text-sm">사진 없음</div>
              )}
            </div>
          </div>

          {/* 처리 사진 (있는 경우) */}
          {report.actionPhotoUrl && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">처리 사진</h2>
              </div>
              <div className="p-4">
                <img
                  src={report.actionPhotoUrl}
                  alt="처리 사진"
                  className="w-full rounded-lg object-cover"
                  style={{ maxHeight: "240px" }}
                />
              </div>
            </div>
          )}

          {/* 위치 정보 */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">위치 정보</h2>
            </div>
            <div className="p-4 space-y-3">
              {report.locationAddr && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">주소</p>
                  <p className="text-sm font-medium text-gray-800">{report.locationAddr}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">위도</p>
                  <p className="text-sm text-gray-700 font-mono">{report.locationLat.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">경도</p>
                  <p className="text-sm text-gray-700 font-mono">{report.locationLng.toFixed(6)}</p>
                </div>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-sm rounded-lg py-2 transition-colors"
              >
                카카오맵에서 보기 →
              </a>
            </div>
          </div>
        </div>

        {/* 우측: 신고 정보 + 처리 */}
        <div className="space-y-4">
          {/* 신고 기본 정보 */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">신고 정보</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">신고 ID</span>
                <span className="font-mono text-xs text-gray-600">{report.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">위반 유형</span>
                <span className="font-medium text-gray-800">{report.violationType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">신고자 연락처</span>
                <span className="font-medium text-gray-800">{report.reporterPhone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">신고 시각</span>
                <span className="text-gray-700">{new Date(report.reportedAt).toLocaleString("ko-KR")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">유예 만료</span>
                <span className={`text-xs font-medium ${isGraceExpired ? "text-red-600" : "text-orange-500"}`}>
                  {gracePeriodEnd.toLocaleString("ko-KR")}
                  {isGraceExpired && " (만료)"}
                </span>
              </div>
            </div>
          </div>

          {/* 업체 + 기기 */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">업체 · 기기</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">업체명</span>
                <span className="font-medium text-gray-800">{report.company.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">업체 연락처</span>
                <span className="text-gray-700">{report.company.contact}</span>
              </div>
              {report.device ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">기기 모델</span>
                    <span className="font-medium text-gray-800">{report.device.model}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">QR 코드</span>
                    <span className="font-mono text-xs text-gray-600">{report.device.qrCode}</span>
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-xs">기기 QR 미스캔 (수동 선택)</div>
              )}
            </div>
          </div>

          {/* 처리 내역 (완료된 경우) */}
          {report.actionResult && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">처리 내역</h2>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">처리 결과</span>
                  <span className="font-medium text-gray-800">{report.actionResult}</span>
                </div>
                {report.actionAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">처리 시각</span>
                    <span className="text-gray-700">{new Date(report.actionAt).toLocaleString("ko-KR")}</span>
                  </div>
                )}
                {report.actionNote && (
                  <div>
                    <p className="text-gray-500 mb-1">처리 메모</p>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-xs">{report.actionNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 직권 처리 (미완료 건) */}
          {isPending && (
            <div className="bg-white rounded-xl shadow overflow-hidden border-2 border-orange-200">
              <div className="px-4 py-3 border-b bg-orange-50">
                <h2 className="text-sm font-semibold text-orange-700">직권 처리</h2>
              </div>
              <div className="p-4 space-y-3">
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={2}
                  placeholder="처리 메모 (선택)"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <div className="grid grid-cols-1 gap-2">
                  {ACTION_RESULTS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => handleAction(a.value)}
                      disabled={processing}
                      className={`rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors ${a.color}`}
                    >
                      {processing ? "처리 중..." : a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
