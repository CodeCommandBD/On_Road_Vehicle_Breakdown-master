"use client";

import { useState, useEffect } from "react";
import {
  Navigation,
  ExternalLink,
  MapPin,
  User,
  AlertCircle,
  RefreshCcw,
  CheckCircle,
} from "lucide-react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-white/5 animate-pulse rounded-2xl flex items-center justify-center text-white/40">
      Loading Garage Map...
    </div>
  ),
});

export default function GarageMapDashboard({
  bookings = [],
  sosAlerts = [],
  garageLocation,
  onRefresh,
  onAcceptSOS,
  lastUpdated,
}) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const newMarkers = [];

    // Add Garage Marker
    if (garageLocation && garageLocation.coordinates) {
      newMarkers.push({
        lat: garageLocation.coordinates[1],
        lng: garageLocation.coordinates[0],
        content: (
          <div className="text-black p-1">
            <h4 className="font-bold border-b pb-1 mb-1">Your Garage</h4>
            <p className="text-[10px] text-gray-600">Active Center</p>
          </div>
        ),
      });
    }

    // Add Booking Markers
    bookings
      .filter((b) => b.location && b.location.coordinates)
      .forEach((booking) => {
        newMarkers.push({
          lat: booking.location.coordinates[1],
          lng: booking.location.coordinates[0],
          content: (
            <div className="text-black p-1 min-w-[150px]">
              <div className="flex items-center gap-2 mb-1 border-b pb-1">
                <User size={12} className="text-blue-500" />
                <h4 className="font-bold text-xs">
                  {booking.user?.name || "Client"}
                </h4>
              </div>
              <p className="text-[10px] text-gray-600 mb-2">
                {booking.service?.name}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${booking.location.coordinates[1]},${booking.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 bg-blue-500 text-white text-[10px] py-1 rounded hover:bg-blue-600 transition-colors"
              >
                <Navigation size={10} /> Get Directions
              </a>
            </div>
          ),
        });
      });

    // Add Emergency SOS Markers
    sosAlerts.forEach((sos) => {
      newMarkers.push({
        lat: sos.location.coordinates[1],
        lng: sos.location.coordinates[0],
        content: (
          <div className="text-black p-1 min-w-[150px]">
            <div className="flex items-center gap-2 mb-1 border-b pb-1">
              <AlertCircle size={12} className="text-red-500 animate-pulse" />
              <h4 className="font-bold text-xs text-red-600">EMERGENCY SOS</h4>
            </div>
            <p className="text-[10px] font-bold mb-1">{sos.user?.name}</p>
            <p className="text-[10px] text-gray-600 mb-2 truncate">
              {sos.location.address}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${sos.location.coordinates[1]},${sos.location.coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 bg-red-600 text-white text-[10px] py-1 rounded hover:bg-red-700 transition-colors"
            >
              <Navigation size={10} /> Emergency Route
            </a>
            <button
              onClick={() => onAcceptSOS(sos._id)}
              className="w-full mt-2 flex items-center justify-center gap-1 bg-red-600 text-white text-[10px] py-1.5 rounded hover:bg-red-700 transition-colors font-bold"
            >
              <CheckCircle size={10} /> Accept & Respond
            </button>
          </div>
        ),
      });
    });

    setMarkers(newMarkers);
  }, [bookings, sosAlerts, garageLocation]);

  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl overflow-hidden shadow-xl mb-8">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="text-orange-500" size={20} />
              Service Map & Navigation
            </h3>
            <p className="text-[10px] text-white/40">
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : "Visualizing active bookings and emergency requests"}
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={() => onRefresh(true)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-all active:scale-95 border border-white/5"
              title="Refresh Map"
            >
              <RefreshCcw size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
              Bookings
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] animate-pulse"></div>
            <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
              SOS Alerts
            </span>
          </div>
        </div>
      </div>

      <div className="relative group">
        <MapComponent
          center={
            garageLocation
              ? [garageLocation.coordinates[1], garageLocation.coordinates[0]]
              : [23.8103, 90.4125]
          }
          zoom={12}
          markers={markers}
          className="h-[450px] w-full"
        />

        {/* Quick Map Legend/Stats Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-white/40 uppercase">On-Job</p>
                <p className="text-lg font-bold text-blue-400">
                  {bookings.length}
                </p>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <p className="text-[10px] text-white/40 uppercase">SOS</p>
                <p className="text-lg font-bold text-red-500">
                  {sosAlerts.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
