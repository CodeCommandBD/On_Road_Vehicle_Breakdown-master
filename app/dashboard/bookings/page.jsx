"use client";

import { useSelector } from "react-redux";
import { selectUserRole } from "@/store/slices/authSlice";
import BookingTable from "@/components/dashboard/BookingTable";

export default function BookingsPage() {
  const role = useSelector(selectUserRole);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Bookings</h1>
      <BookingTable type={role || "user"} />
    </div>
  );
}
