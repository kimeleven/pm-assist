"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const GUMI_CENTER = { lat: 36.1195, lng: 128.3441 };

const PIN_ICON = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 11.2 16 26 16 26S32 27.2 32 16C32 7.163 24.837 0 16 0z" fill="#2563eb"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
  className: "",
});

interface Props {
  location: { lat: number; lng: number } | null;
  onSelect: (loc: { lat: number; lng: number }) => void;
}

function ClickHandler({ onSelect }: { onSelect: (loc: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterOnLocation({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();
  const prevRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!location) return;
    const prev = prevRef.current;
    // 처음 위치 설정 시 또는 위치가 크게 바뀔 때만 센터 이동
    if (!prev || Math.abs(prev.lat - location.lat) > 0.001 || Math.abs(prev.lng - location.lng) > 0.001) {
      map.setView([location.lat, location.lng], 17);
    }
    prevRef.current = location;
  }, [location, map]);

  return null;
}

export default function LocationPicker({ location, onSelect }: Props) {
  const center = location ?? GUMI_CENTER;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={location ? 17 : 13}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={onSelect} />
      <RecenterOnLocation location={location} />
      {location && (
        <Marker
          position={[location.lat, location.lng]}
          icon={PIN_ICON}
          draggable={true}
          eventHandlers={{
            dragend(e) {
              const latlng = (e.target as L.Marker).getLatLng();
              onSelect({ lat: latlng.lat, lng: latlng.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
