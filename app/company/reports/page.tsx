"use client";

import { useEffect, useState, useRef } from "react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { ReportStatus } from "@prisma/client";

interface Report {
  id: string;
  violationType: string;
  status: ReportStatus;
  reportedAt: string;
  gracePeriodEnd: string;
  locationAddr?: string;
}

type ActionResult = "FIXED" | "NOT_FOUND";

export default function CompanyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult>("FIXED");
  const [actionPhotoUrl, setActionPhotoUrl] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/reports?status=RECEIVED")
      .then((r) => r.json())
      .then((d) => { setReports(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (res.ok) {
      const { url } = await res.json();
      setActionPhotoUrl(url);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setMessage("");

    const res = await fetch(`/api/reports/${selected.id}/action`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionResult, actionPhotoUrl, actionNote }),
    });

    setSubmitting(false);
    if (res.ok) {
      setMessage("✅ 조치결과가 등록되었습니다. 신고자에게 알림이 발송됩니다.");
      setReports((prev) => prev.filter((r) => r.id !== selected.id));
      setSelected(null);
      setActionPhotoUrl("");
      setActionNote("");
    } else {
      setMessage("❌ 등록에 실패했습니다.");
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">조치결과 등록</h1>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 text-sm text-blue-700 border border-blue-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* 신고 목록 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700">처리 대기 신고</h2>
          </div>
          {loading ? (
            <div className="text-center text-gray-400 py-8 text-sm">로딩 중...</div>
          ) : reports.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">처리 대기 신고가 없습니다.</div>
          ) : (
            <div className="divide-y">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selected?.id === r.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">{r.violationType}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.reportedAt).toLocaleString("ko-KR")}
                  </p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 처리 폼 */}
        <div className="bg-white rounded-xl shadow p-5">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              왼쪽 목록에서 신고를 선택하세요.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-semibold text-gray-800">조치결과 등록</h2>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p className="text-gray-600">위반유형: <strong>{selected.violationType}</strong></p>
                <p className="text-gray-400 text-xs">신고: {new Date(selected.reportedAt).toLocaleString("ko-KR")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">처리결과 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["FIXED", "NOT_FOUND"] as ActionResult[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setActionResult(v)}
                      className={`border rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                        actionResult === v
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-gray-300 text-gray-600 hover:border-green-400"
                      }`}
                    >
                      {v === "FIXED" ? "✅ 정비완료" : "🔍 기기미발견"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">현장 사진</label>
                {actionPhotoUrl ? (
                  <img src={actionPhotoUrl} alt="조치 사진" className="w-full h-32 object-cover rounded-lg" />
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 text-gray-400 rounded-lg py-6 text-sm hover:border-green-400"
                  >
                    📸 사진 업로드
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="특이사항 입력 (선택)"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "등록 중..." : "조치결과 등록"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
