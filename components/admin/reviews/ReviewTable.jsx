"use client";

import {
  Star,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export default function ReviewTable() {
  const queryClient = useQueryClient();
  const [filterRating, setFilterRating] = useState("all");

  const { data: reviewsData, isLoading: loading } = useQuery({
    queryKey: ["adminReviews", filterRating],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterRating !== "all") params.append("rating", filterRating);
      const response = await axiosInstance.get(
        `/api/admin/reviews?${params.toString()}`,
      );
      return response.data.data.reviews || [];
    },
  });

  const reviews = reviewsData || [];

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.delete(`/api/admin/reviews/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete review");
    },
  });

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone.",
      )
    )
      return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Latest Reviews</h3>
          <div className="text-sm text-white/60">Manage User Feedback</div>
        </div>

        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF532D]"
        >
          <option value="all" className="bg-[#1A1A1A] text-white">
            All Ratings
          </option>
          <option value="5" className="bg-[#1A1A1A] text-white">
            5 Stars
          </option>
          <option value="4" className="bg-[#1A1A1A] text-white">
            4 Stars
          </option>
          <option value="3" className="bg-[#1A1A1A] text-white">
            3 Stars
          </option>
          <option value="2" className="bg-[#1A1A1A] text-white">
            2 Stars
          </option>
          <option value="1" className="bg-[#1A1A1A] text-white">
            1 Star
          </option>
        </select>
      </div>

      <div className="overflow-x-auto min-h-[200px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Garage</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4 w-1/3">Comment</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/5 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/5 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/5 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/5 rounded w-48"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/5 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/5 rounded w-8 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-10 text-center text-white/40"
                >
                  No reviews found.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr
                  key={review._id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {review.garage?.name || "Unknown Garage"}
                  </td>
                  <td className="px-6 py-4 text-white/80">
                    <div className="text-sm">
                      {review.user?.name || "Unknown User"}
                    </div>
                    <div className="text-xs text-white/40">
                      {review.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < review.rating
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-white/20"
                          }
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70 text-sm">
                    {review.comment}
                  </td>
                  <td className="px-6 py-4 text-white/40 text-xs">
                    {review.createdAt
                      ? format(new Date(review.createdAt), "dd MMM yyyy")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
