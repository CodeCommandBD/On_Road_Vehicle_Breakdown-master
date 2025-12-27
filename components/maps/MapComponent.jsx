"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcon = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng);
      }
    },
  });
  return null;
}

export default function MapComponent({
  center = [23.8103, 90.4125], // Dhaka
  zoom = 13,
  markers = [],
  polylines = [],
  onLocationSelect,
  className = "h-[400px] w-full rounded-xl overflow-hidden shadow-lg border border-white/10",
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fixLeafletIcon();
  }, []);

  if (!isMounted) {
    return (
      <div
        className={`${className} bg-white/5 animate-pulse flex items-center justify-center`}
      >
        <p className="text-white/40">Loading Map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      key={`${center[0]}-${center[1]}-${zoom}`}
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className={className}
      style={{ height: "400px", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} zoom={zoom} />
      {onLocationSelect && <MapEvents onLocationSelect={onLocationSelect} />}

      {markers.map((marker, idx) => (
        <Marker
          key={idx}
          position={[marker.lat, marker.lng]}
          icon={marker.icon || new L.Icon.Default()}
        >
          {marker.content && (
            <Popup>
              <div className="text-black font-sans">{marker.content}</div>
            </Popup>
          )}
        </Marker>
      ))}

      {polylines.map((polyline, idx) => (
        <Polyline
          key={idx}
          positions={polyline.positions}
          color={polyline.color || "blue"}
          dashArray={polyline.dashArray || null}
        />
      ))}
    </MapContainer>
  );
}
