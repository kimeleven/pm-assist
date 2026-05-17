"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { VIOLATION_TYPES } from "@/lib/utils";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });
const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { ssr: false });

type Step = "phone" | "qr" | "location" | "photo" | "info" | "done";

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-800 text-sm">개인정보 수집·이용 및 위치정보 제공 동의</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-xs text-gray-600 space-y-5">
          <section>
            <h4 className="font-semibold text-gray-800 mb-2">1. 개인정보 수집·이용 동의</h4>
            <table className="w-full border border-gray-200 rounded text-xs">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-50 px-2 py-1.5 font-medium w-24">수집 항목</td>
                  <td className="px-2 py-1.5">휴대폰 번호, 신고 사진</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-50 px-2 py-1.5 font-medium">수집 목적</td>
                  <td className="px-2 py-1.5">무단방치 PM 신고 접수 및 처리결과 통보</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-50 px-2 py-1.5 font-medium">보유 기간</td>
                  <td className="px-2 py-1.5">신고 처리 완료 후 1년</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 px-2 py-1.5 font-medium">제3자 제공</td>
                  <td className="px-2 py-1.5">PM 업체(처리 목적 한정), 관할 행정기관</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-gray-500 leading-relaxed">
              귀하는 개인정보 수집·이용에 동의를 거부할 권리가 있으나, 거부 시 신고 서비스 이용이 불가합니다.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-800 mb-2">2. 위치정보 수집·이용 동의</h4>
            <table className="w-full border border-gray-200 rounded text-xs">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-50 px-2 py-1.5 font-medium w-24">수집 항목</td>
                  <td className="px-2 py-1.5">GPS 위치 좌표 (위도·경도)</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-50 px-2 py-1.5 font-medium">수집 목적</td>
                  <td className="px-2 py-1.5">무단방치 PM 위치 확인 및 현장 출동</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-50 px-2 py-1.5 font-medium">보유 기간</td>
                  <td className="px-2 py-1.5">신고 처리 완료 후 1년</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 px-2 py-1.5 font-medium">제3자 제공</td>
                  <td className="px-2 py-1.5">PM 업체(수거 목적), 관할 행정기관</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-gray-500 leading-relaxed">
              위치정보는 신고된 PM의 위치 확인 목적으로만 사용되며, 그 외 용도로는 활용되지 않습니다.
              귀하는 위치정보 제공에 동의를 거부할 권리가 있으나, 거부 시 신고 서비스 이용이 불가합니다.
            </p>
          </section>

          <section className="bg-blue-50 rounded-lg px-3 py-2.5">
            <p className="text-blue-700 leading-relaxed">
              본 서비스는 인천광역시 공유 개인형 이동장치(PM) 무단방치 신고·관리를 위해 운영됩니다.
              수집된 정보는 「개인정보 보호법」 및 「위치정보의 보호 및 이용 등에 관한 법률」에 따라 보호됩니다.
            </p>
          </section>
        </div>
        <div className="px-5 py-4 border-t">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

interface Company {
  id: string;
  name: string;
}

const MAX_PHOTOS = 3;

export default function ReportPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [qrResult, setQrResult] = useState("");
  const [qrScanning, setQrScanning] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddr, setLocationAddr] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [violationType, setViolationType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState("");
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCompanies)
      .catch(() => {});
  }, []);

  function nextStep(current: Step) {
    const order: Step[] = ["phone", "qr", "location", "photo", "info", "done"];
    const idx = order.indexOf(current);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  }

  const handleQrSuccess = useCallback(async (text: string) => {
    setQrResult(text);
    setQrScanning(false);
    try {
      const res = await fetch(`/api/devices?qrCode=${encodeURIComponent(text)}`);
      if (res.ok) {
        const device = await res.json();
        if (device?.company?.id) {
          setSelectedCompanyId(device.company.id);
        }
      }
    } catch {
      // 업체 식별 실패해도 수동 선택으로 계속
    }
    nextStep("qr");
  }, []);

  function getGpsLocation() {
    setError("");
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setError("이 기기에서는 위치 정보를 사용할 수 없습니다.");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setError("위치 권한이 필요합니다. 권한을 허용하거나 지도에서 직접 선택해 주세요.");
        setGpsLoading(false);
      }
    );
  }

  async function uploadPhoto(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("사진 업로드 실패");
    const { url } = await res.json();
    return url as string;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError("");

    const remaining = MAX_PHOTOS - photoUrls.length;
    const toUpload = Array.from(files).slice(0, remaining);

    try {
      setUploadingIdx(photoUrls.length);
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const url = await uploadPhoto(file);
        uploaded.push(url);
      }
      setPhotoUrls((prev) => [...prev, ...uploaded]);
    } catch {
      setError("사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingIdx(null);
      // input 초기화 (같은 파일 재선택 가능하도록)
      e.target.value = "";
    }
  }

  function removePhoto(idx: number) {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!violationType || !selectedCompanyId) {
      setError("위반유형과 업체를 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reporterPhone: phone,
        qrCode: qrResult || null,
        companyId: selectedCompanyId,
        violationType,
        locationLat: location!.lat,
        locationLng: location!.lng,
        locationAddr,
        photoUrls,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "신고 접수에 실패했습니다.");
      return;
    }
    setReportId(data.id);
    setStep("done");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden">
        {/* 헤더 */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-lg font-bold">🛴 공유PM 신고</h1>
          <p className="text-blue-100 text-xs mt-0.5">무단방치 킥보드·전동자전거 신고</p>
        </div>

        <div className="p-6">
          {/* Step 1: 전화번호 */}
          {step === "phone" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">1단계: 본인 확인</h2>
              <p className="text-sm text-gray-500">
                신고 접수 및 처리결과 알림을 위해 연락처를 입력해 주세요.
              </p>
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 flex-shrink-0"
                />
                <span>
                  개인정보 수집·이용 및 위치정보 제공에 동의합니다.{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-500 underline text-xs"
                  >
                    약관 보기
                  </button>
                  <br />
                  <span className="text-xs text-gray-400">미동의 시 신고 불가</span>
                </span>
              </label>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={() => {
                  if (!phone.match(/^010-?\d{4}-?\d{4}$/)) {
                    setError("올바른 휴대폰 번호를 입력해 주세요.");
                    return;
                  }
                  if (!agreed) {
                    setError("개인정보 수집에 동의해 주세요.");
                    return;
                  }
                  setError("");
                  nextStep("phone");
                }}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700"
              >
                다음
              </button>
            </div>
          )}

          {/* Step 2: QR 스캔 */}
          {step === "qr" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">2단계: QR코드 스캔 (선택)</h2>
              <p className="text-sm text-gray-500">
                킥보드의 QR코드를 스캔하면 업체가 자동으로 식별됩니다.
              </p>
              {qrScanning ? (
                <QrScanner
                  onSuccess={handleQrSuccess}
                  onCancel={() => { setQrScanning(false); nextStep("qr"); }}
                />
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  ✅ QR 스캔 완료: <span className="font-mono">{qrResult}</span>
                  {selectedCompanyId && <p className="text-xs mt-1 text-green-600">업체가 자동으로 식별되었습니다.</p>}
                </div>
              )}
            </div>
          )}

          {/* Step 3: 위치 확인 */}
          {step === "location" && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-800">3단계: 위치 확인</h2>
              <p className="text-sm text-gray-500">
                GPS로 자동 수집하거나, 지도를 탭해서 직접 위치를 선택하세요.
              </p>

              {/* 지도 */}
              <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 260 }}>
                <LocationPicker
                  location={location}
                  onSelect={(loc) => {
                    setLocation(loc);
                    setError("");
                  }}
                />
              </div>

              <p className="text-xs text-gray-400 text-center">지도를 탭하거나 핀을 드래그해 정확한 위치를 지정하세요</p>

              {/* GPS 버튼 */}
              <button
                onClick={getGpsLocation}
                disabled={gpsLoading}
                className="w-full border-2 border-dashed border-blue-400 text-blue-600 rounded-lg py-3 text-sm font-semibold hover:bg-blue-50 disabled:opacity-50"
              >
                {gpsLoading ? "위치 감지 중..." : "📍 현재 위치 자동으로 가져오기"}
              </button>

              {location && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700">
                  ✅ 위치 선택됨 — 위도 {location.lat.toFixed(5)} / 경도 {location.lng.toFixed(5)}
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={() => nextStep("location")}
                disabled={!location}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}

          {/* Step 4: 사진 업로드 (최소 1장, 최대 3장) */}
          {step === "photo" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">4단계: 위반 현장 사진</h2>
              <p className="text-sm text-gray-500">
                최소 1장, 최대 3장까지 사진을 첨부할 수 있습니다.
              </p>

              {/* 사진 미리보기 그리드 */}
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none hover:bg-black/80"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                  {/* 업로드 중 플레이스홀더 */}
                  {uploadingIdx !== null && (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center text-xs text-blue-400">
                      업로드 중...
                    </div>
                  )}
                </div>
              )}

              {/* 사진 추가 버튼 (3장 미만일 때) */}
              {photoUrls.length < MAX_PHOTOS && uploadingIdx === null && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-blue-400 text-blue-600 rounded-lg py-8 text-sm font-semibold hover:bg-blue-50"
                >
                  {photoUrls.length === 0
                    ? "📸 사진 촬영 / 파일 선택 (필수)"
                    : `📸 사진 추가 (${photoUrls.length}/${MAX_PHOTOS})`}
                </button>
              )}

              {photoUrls.length === MAX_PHOTOS && (
                <p className="text-xs text-center text-gray-400">최대 3장 첨부 완료</p>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={() => nextStep("photo")}
                disabled={photoUrls.length === 0}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
              >
                다음 ({photoUrls.length}장 첨부됨)
              </button>
            </div>
          )}

          {/* Step 5: 업체·위반유형 선택 */}
          {step === "info" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">5단계: 신고 정보 입력</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PM업체 선택</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">-- 업체 선택 --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">위반유형</label>
                <div className="grid grid-cols-2 gap-2">
                  {VIOLATION_TYPES.map((v) => (
                    <button
                      key={v}
                      onClick={() => setViolationType(v)}
                      className={`border rounded-lg py-2 text-xs font-medium transition-colors ${
                        violationType === v
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-300 text-gray-600 hover:border-blue-400"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "접수 중..." : "신고 접수"}
              </button>
            </div>
          )}

          {/* 완료 */}
          {step === "done" && (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-lg font-bold text-gray-800">신고가 접수되었습니다</h2>
              <p className="text-sm text-gray-500">
                접수번호: <span className="font-mono text-blue-600">{reportId.slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="text-sm text-gray-500">
                처리가 완료되면 입력하신 연락처({phone})로 문자가 발송됩니다.
              </p>
              <a
                href="/my-reports"
                className="inline-block mt-2 text-sm text-blue-600 underline"
              >
                나의 신고 현황 조회
              </a>
              <button
                onClick={() => {
                  setStep("phone");
                  setPhone("");
                  setAgreed(false);
                  setQrResult("");
                  setQrScanning(true);
                  setLocation(null);
                  setPhotoUrls([]);
                  setViolationType("");
                  setSelectedCompanyId("");
                  setReportId("");
                  setError("");
                }}
                className="block w-full mt-2 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                추가 신고하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
