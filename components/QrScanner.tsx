"use client";

import { useEffect, useRef } from "react";

interface Props {
  onSuccess: (text: string) => void;
  onCancel: () => void;
}

export default function QrScanner({ onSuccess, onCancel }: Props) {
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);

  useEffect(() => {
    const elementId = "pm-qr-reader";

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      const scanner = new Html5QrcodeScanner(
        elementId,
        { fps: 10, qrbox: 250, rememberLastUsedCamera: true },
        false
      );
      scannerRef.current = scanner;
      scanner.render(
        (decodedText: string) => {
          scanner.clear().catch(() => {});
          onSuccess(decodedText);
        },
        () => {}
      );
    });

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onSuccess]);

  return (
    <div className="space-y-3">
      <div id="pm-qr-reader" className="rounded-lg overflow-hidden" />
      <button
        onClick={() => {
          scannerRef.current?.clear().catch(() => {});
          onCancel();
        }}
        className="w-full border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50"
      >
        QR 스킵 (수동 선택)
      </button>
    </div>
  );
}
