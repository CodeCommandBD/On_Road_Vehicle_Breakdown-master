"use client";

import { useEffect, useState, useRef } from "react";
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

// Global map instance tracker to prevent double initialization
const mapInstances = new Map();

// Fix for default marker icons in Leaflet with Next.js
let iconFixed = false;
const fixLeafletIcon = () => {
  if (typeof window !== "undefined" && !iconFixed) {
    try {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      iconFixed = true;
    } catch (error) {
      console.error("Error fixing Leaflet icon:", error);
    }
  }
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      try {
        map.setView(center, zoom || map.getZoom());
      } catch (error) {
        console.error("Error setting map view:", error);
      }
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
  const containerRef = useRef(null);
  const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if this map instance already exists
    if (mapInstances.has(mapId.current)) {
      console.log("Map instance already exists, skipping initialization");
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      fixLeafletIcon();
      setIsMounted(true);
      mapInstances.set(mapId.current, true);
    }, 150);

    return () => {
      clearTimeout(timer);
      // Cleanup map instance
      if (mapInstances.has(mapId.current)) {
        mapInstances.delete(mapId.current);
      }
    };
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
    <div ref={containerRef} className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} zoom={zoom} />
        {onLocationSelect && <MapEvents onLocationSelect={onLocationSelect} />}

        {markers.map((marker, idx) => (
          <Marker
            key={`marker-${idx}-${marker.lat}-${marker.lng}`}
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
            key={`polyline-${idx}`}
            positions={polyline.positions}
            color={polyline.color || "blue"}
            dashArray={polyline.dashArray || null}
          />
        ))}
      </MapContainer>
    </div>
  );
}
