"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function makeIcon(isOverGrace: boolean) {
  const color = isOverGrace ? "#ef4444" : "#22c55e";
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.8 14 22 14 22S28 23.8 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>
  `);
  return L.divIcon({
    html: `<img src="data:image/svg+xml,${svg}" width="28" height="36" />`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    className: "",
  });
}

function RecenterMap({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center.lat, center.lng, map]);
  return null;
}

export default function KakaoMap({ markers, onMarkerClick, center }: Props) {
  const mapCenter = center ?? INCHEON_CENTER;

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={mapCenter} />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={makeIcon(m.isOverGrace)}
          eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
        >
          <Popup>
            <div style={{ fontSize: 12, maxWidth: 180 }}>
              <b>{m.label}</b>
              <br />
              {m.detail}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
