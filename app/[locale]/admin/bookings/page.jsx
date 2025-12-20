"use client";

import BookingTable from "@/components/admin/bookings/BookingTable";

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Booking Management</h1>
        <p className="text-white/60">Track and monitor all service requests across the platform.</p>
      </div>

      <BookingTable />
    </div>
  );
}
