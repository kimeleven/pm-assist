"use client";

import { useState, useEffect, useRef } from "react";
import { VIOLATION_TYPES } from "@/lib/utils";

type Step = "phone" | "qr" | "location" | "photo" | "info" | "done";

interface Company {
  id: string;
  name: string;
}

export default function ReportPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [qrResult, setQrResult] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddr, setLocationAddr] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [violationType, setViolationType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState("");
  const [error, setError] = useState("");
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

  async function getLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("이 기기에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        nextStep("location");
      },
      () => setError("위치 정보를 가져올 수 없습니다. 권한을 허용해 주세요.")
    );
  }

  async function uploadPhoto(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("사진 업로드 실패");
    const { url } = await res.json();
    return url as string;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const url = await uploadPhoto(file);
      setPhotoUrl(url);
      nextStep("photo");
    } catch {
      setError("사진 업로드 중 오류가 발생했습니다.");
    }
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
        photoUrl,
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
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  개인정보 수집·이용 및 위치정보 제공에 동의합니다.
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
              <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-500">
                📷 QR스캔 기능은 Kakao Maps API 키 설정 후 활성화됩니다.
                <br />
                아래에서 업체를 직접 선택해 주세요.
              </div>
              <button
                onClick={() => nextStep("qr")}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700"
              >
                다음 (QR 스킵)
              </button>
            </div>
          )}

          {/* Step 3: 위치 확인 */}
          {step === "location" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">3단계: 위치 확인</h2>
              <p className="text-sm text-gray-500">현재 위치(킥보드 위치)를 자동으로 수집합니다.</p>
              {location ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  ✅ 위치 수집 완료
                  <br />
                  <span className="text-xs text-green-600">
                    위도: {location.lat.toFixed(5)} / 경도: {location.lng.toFixed(5)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={getLocation}
                  className="w-full border-2 border-dashed border-blue-400 text-blue-600 rounded-lg py-6 text-sm font-semibold hover:bg-blue-50"
                >
                  📍 현재 위치 가져오기
                </button>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              {location && (
                <button
                  onClick={() => nextStep("location")}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700"
                >
                  다음
                </button>
              )}
            </div>
          )}

          {/* Step 4: 사진 업로드 */}
          {step === "photo" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">4단계: 위반 현장 사진</h2>
              <p className="text-sm text-gray-500">킥보드가 방치된 현장 사진을 촬영하거나 선택하세요.</p>
              {photoUrl ? (
                <div className="rounded-lg overflow-hidden border">
                  <img src={photoUrl} alt="업로드된 사진" className="w-full h-48 object-cover" />
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-blue-400 text-blue-600 rounded-lg py-10 text-sm font-semibold hover:bg-blue-50"
                >
                  📸 사진 촬영 / 파일 선택
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              {photoUrl && (
                <button
                  onClick={() => nextStep("photo")}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700"
                >
                  다음
                </button>
              )}
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
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  setLocation(null);
                  setPhotoUrl("");
                  setViolationType("");
                  setSelectedCompanyId("");
                  setReportId("");
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
