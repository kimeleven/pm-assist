"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";

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

const GUMI_CENTER: [number, number] = [36.1195, 128.3441];

/** 마커가 변경될 때 지도 중심 이동은 하지 않는 더미 컴포넌트 (MapContainer 외부에서 useMap 사용 불가) */
function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function KakaoMap({ markers, onMarkerClick, center }: Props) {
  const mapCenter: [number, number] = center
    ? [center.lat, center.lng]
    : GUMI_CENTER;

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnChange center={mapCenter} />
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={10}
          pathOptions={{
            color: m.isOverGrace ? "#dc2626" : "#16a34a",
            fillColor: m.isOverGrace ? "#ef4444" : "#22c55e",
            fillOpacity: 0.85,
            weight: 2,
          }}
          eventHandlers={{
            click: () => onMarkerClick?.(m.id),
          }}
        >
          <Popup>
            <div style={{ fontSize: "12px", maxWidth: "180px" }}>
              <strong>{m.label}</strong>
              <br />
              {m.detail}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
