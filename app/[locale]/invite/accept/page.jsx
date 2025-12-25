"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/slices/authSlice";
import axios from "axios";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const dispatch = useDispatch();

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Verifying invitation...");

  useEffect(() => {
    if (token) {
      setStatus("verifying");
      acceptInvitation(token);
    } else {
      // Small delay to check if token is really missing or just hydrating
      const timer = setTimeout(() => {
        if (!token) {
          setStatus("error");
          setMessage("Invalid invitation link. Token is missing.");
        }
      }, 2000); // Increased delay to 2s
      return () => clearTimeout(timer);
    }
  }, [token]);

  const acceptInvitation = async (token) => {
    try {
      const res = await axios.post("/api/invite/accept", { token });
      setStatus("success");
      setMessage(res.data.message || "Invitation accepted successfully!");
      toast.success("Welcome to the team!");

      // Fetch the latest user profile to update Redux (isTeamMember etc.)
      try {
        const profileRes = await axios.get("/api/profile");
        if (profileRes.data.success) {
          dispatch(updateUser(profileRes.data.user));
        }
      } catch (profileError) {
        console.error("Failed to refresh profile:", profileError);
      }

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/user/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Accept error:", error);
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
          "Failed to accept invitation. It may be expired or invalid."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md w-full text-center">
        {status === "verifying" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verifying</h2>
            <p className="text-gray-400">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-red-400 mb-6">{message}</p>
            <button
              onClick={() => router.push("/user/dashboard")}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteAcceptContent />
    </Suspense>
  );
}
