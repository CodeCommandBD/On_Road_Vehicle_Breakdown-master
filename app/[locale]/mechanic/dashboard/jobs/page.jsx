"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Car,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

export default function OpenJobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/mechanic/jobs");
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId) => {
    setAcceptingId(jobId);
    try {
      const res = await fetch("/api/mechanic/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: jobId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Job Accepted! 🚀");
        router.push(`/mechanic/dashboard/bookings/${jobId}`);
      } else {
        toast.error(data.message);
        setAcceptingId(null);
      }
    } catch (error) {
      toast.error("Failed to accept job");
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500 mt-1">
            There are no open jobs currently available.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">
                      Booking #{job.bookingNumber}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-lg font-bold">
                  {job.paymentMethod?.toUpperCase() || "CASH"}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">
                    {job.location?.address || "Location not specified"}
                  </span>
                </div>

                {job.description && (
                  <div className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{job.description}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => handleAcceptJob(job._id)}
                disabled={acceptingId === job._id}
                className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {acceptingId === job._id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Accept Job"
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
