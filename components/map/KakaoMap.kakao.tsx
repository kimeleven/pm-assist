"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (cb: () => void) => void;
        Map: new (container: HTMLElement, opts: object) => KakaoMapInstance;
        LatLng: new (lat: number, lng: number) => object;
        Marker: new (opts: object) => KakaoMarker;
        InfoWindow: new (opts: object) => KakaoInfoWindow;
        event: { addListener: (target: object, type: string, handler: () => void) => void };
        MarkerImage: new (src: string, size: object, opts?: object) => object;
        Size: new (w: number, h: number) => object;
        Point: new (x: number, y: number) => object;
      };
    };
  }
}

interface KakaoMapInstance {
  setCenter: (latlng: object) => void;
}

interface KakaoMarker {
  setMap: (map: KakaoMapInstance | null) => void;
  getPosition: () => object;
}

interface KakaoInfoWindow {
  open: (map: KakaoMapInstance, marker: KakaoMarker) => void;
  close: () => void;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  isOverGrace: boolean;
  label: string;
  detail: string;
}

interface Props {
  markers: MapMarker[];
  onMarkerClick?: (id: string) => void;
  center?: { lat: number; lng: number };
}

const INCHEON_CENTER = { lat: 37.4563, lng: 126.7052 };

export default function KakaoMap({ markers, onMarkerClick, center }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!appKey || appKey === "your-kakao-javascript-app-key") return;

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!containerRef.current) return;
        const { lat, lng } = center ?? INCHEON_CENTER;
        const map = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 5,
        });
        mapRef.current = map;
        renderMarkers(map);
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) renderMarkers(mapRef.current);
  }, [markers]);

  function renderMarkers(map: KakaoMapInstance) {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    markers.forEach((m) => {
      const pos = new window.kakao.maps.LatLng(m.lat, m.lng);
      const color = m.isOverGrace ? "red" : "green";
      const markerImg = new window.kakao.maps.MarkerImage(
        `https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_${color}.png`,
        new window.kakao.maps.Size(31, 35),
        { offset: new window.kakao.maps.Point(15, 35) }
      );
      const marker = new window.kakao.maps.Marker({ position: pos, image: markerImg, map });
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px;font-size:12px;max-width:180px"><b>${m.label}</b><br/>${m.detail}</div>`,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        infoWindow.open(map, marker);
        onMarkerClick?.(m.id);
      });

      markersRef.current.push(marker);
    });
  }

  const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
  const isKeySet = appKey && appKey !== "your-kakao-javascript-app-key";

  if (!isKeySet) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
        <span className="text-3xl">🗺️</span>
        <p>지도를 표시하려면 Kakao Maps API 키가 필요합니다.</p>
        <p className="text-xs">.env 파일에 NEXT_PUBLIC_KAKAO_APP_KEY를 설정하세요.</p>
        <div className="mt-4 space-y-1 text-left w-64">
          {markers.map((m) => (
            <button
              key={m.id}
              onClick={() => onMarkerClick?.(m.id)}
              className={`w-full text-left text-xs px-3 py-1.5 rounded border ${
                m.isOverGrace ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"
              }`}
            >
              {m.isOverGrace ? "🔴" : "🟢"} {m.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
