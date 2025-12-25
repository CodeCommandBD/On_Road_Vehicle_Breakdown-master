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
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            Available Operations
          </h1>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">
            Regional Dispatch Pool
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Scanning Sector...
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-32 bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-white/5 backdrop-blur-xl">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
              <CheckCircle className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white">Area Clear</h3>
            <p className="text-slate-500 mt-2 font-medium">
              No active distress signals detected in your sector.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="group relative overflow-hidden bg-slate-900/30 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 hover:border-indigo-500/30 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <Car className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight uppercase">
                        Signal #{job.bookingNumber}
                      </h3>
                      <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mt-0.5">
                        {new Date(job.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                    {job.paymentMethod || "CASH"}
                  </div>
                </div>

                {/* Details */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <MapPin className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                        Target Location
                      </p>
                      <p className="text-sm font-bold text-slate-300 line-clamp-2">
                        {job.location?.address || "Coordinates Classified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                        Mission Intel
                      </p>
                      <p className="text-sm font-bold text-slate-300 line-clamp-2">
                        {job.description ||
                          "General emergency assistance requested"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => handleAcceptJob(job._id)}
                  disabled={acceptingId === job._id}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {acceptingId === job._id ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      Accept Mission
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
