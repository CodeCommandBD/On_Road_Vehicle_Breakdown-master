"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icons in Next.js
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

export default function MapComponent({
  center = [23.8103, 90.4125], // Default: Dhaka
  zoom = 13,
  markers = [],
  className = "h-[400px] w-full rounded-lg",
}) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.position}>
            <Popup>{marker.popup || "Location"}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
