"use client";

import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export default function ReviewForm({ bookingId, onReviewSubmitted }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const reviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const res = await axiosInstance.post("/reviews", reviewData);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Thank you for your review!");
      if (onReviewSubmitted) onReviewSubmitted();
      queryClient.invalidateQueries({ queryKey: ["userReviews"] });
      queryClient.invalidateQueries({ queryKey: ["garageReviews"] });
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });
    },
    onError: (error) => {
      console.error("Review submission failed:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.warning("Please provide a rating");
      return;
    }
    reviewMutation.mutate({ bookingId, rating, comment });
  };

  const submitting = reviewMutation.isPending;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8">
      <div className="max-w-md mx-auto text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Rate Your Experience
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          How was the service provided by this garage?
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform active:scale-95"
              >
                <Star
                  className={`w-10 h-10 ${
                    (hoveredRating || rating) >= star
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked or what can be improved..."
            className="w-full p-4 bg-white text-gray-900 placeholder-gray-400 border border-orange-200 rounded-2xl h-32 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all disabled:opacity-50 shadow-glow-orange"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-4" />
            )}
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}
