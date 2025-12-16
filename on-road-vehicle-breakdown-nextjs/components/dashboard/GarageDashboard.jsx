import { useEffect, useState } from "react";
import StatsCards from "@/components/dashboard/StatsCards";
import BookingTable from "@/components/dashboard/BookingTable";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";

export default function GarageDashboard({ user }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    points: 4.8, // Mock rating
    activeRequests: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const response = await axios.get(
          `/api/bookings?userId=${user._id}&role=garage`
        );
        if (response.data.success) {
          const fetchedBookings = response.data.bookings;
          setBookings(fetchedBookings);

          // Calculate Stats
          const totalBookings = fetchedBookings.length;
          const activeRequests = fetchedBookings.filter(
            (b) => b.status === "pending" || b.status === "accepted"
          ).length;
          const totalRevenue = fetchedBookings.reduce(
            (acc, curr) => acc + (curr.estimatedCost || 0),
            0
          );

          setStats({
            totalBookings,
            totalSpent: totalRevenue,
            points: 4.8, // Could fetch from Garage model
            activeRequests,
          });
        }
      } catch (error) {
        console.error("Dashboard Error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#ff4800]" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Garage Overview</h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold">{user?.name}</span>
          </p>
        </div>
        <Link href="/dashboard/services/new" className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Add Service
        </Link>
      </div>

      <StatsCards stats={stats} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <BookingTable type="garage" bookings={bookings} />
        </div>
        {/* Can add more garage specific widgets here later */}
      </div>
    </div>
  );
}
