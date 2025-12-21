"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import axios from "axios";
import { Star, ThumbsUp, MessageSquare, Loader2, Filter } from "lucide-react";
import { useTranslations } from "next-intl";

export default function GarageReviewsPage() {
  const t = useTranslations("Garage"); // Assuming Garage translations exist
  const commonT = useTranslations("Common");
  const user = useSelector(selectUser);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?._id) return;
      try {
        const response = await axios.get(`/api/reviews?garageId=${user._id}`);
        if (response.data.success) {
          setReviews(response.data.reviews);
          // Calculate stats locally if not provided by API
          // Assuming API returns an array of reviews
          const total = response.data.reviews.length;
          const sum = response.data.reviews.reduce(
            (acc, r) => acc + r.rating,
            0
          );
          const average = total > 0 ? (sum / total).toFixed(1) : 0;

          const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          response.data.reviews.forEach((r) => {
            if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
          });

          setStats({ average, total, breakdown });
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [user?._id]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {t("customerReviews") || "Customer Reviews"}
        </h1>
        <p className="text-white/60">
          {t("reviewsDesc") || "See what your customers are saying about you."}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Rating Card */}
        <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-white/60 font-medium mb-4">Overall Rating</h3>
          <div className="text-6xl font-bold text-white mb-4">
            {stats.average}
          </div>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                className={`${
                  star <= Math.round(stats.average)
                    ? "text-orange-500 fill-orange-500"
                    : "text-white/20"
                }`}
              />
            ))}
          </div>
          <p className="text-white/40 text-sm">
            Based on {stats.total} reviews
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="md:col-span-2 bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-6">Rating Breakdown</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-white font-bold">{rating}</span>
                  <Star size={12} className="text-white/40" />
                </div>
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.total > 0
                          ? (stats.breakdown[rating] / stats.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="w-12 text-right text-white/40 text-sm">
                  {stats.breakdown[rating]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <MessageSquare className="text-orange-500" size={24} />
          Recent Feedback
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="text-white/20" size={32} />
            </div>
            <p className="text-white/60">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="pb-6 border-b border-white/5 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                      {review.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h4 className="text-white font-bold">
                        {review.user?.name || "Unknown User"}
                      </h4>
                      <p className="text-xs text-white/40">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                    <span className="text-orange-500 font-bold">
                      {review.rating}
                    </span>
                    <Star
                      size={14}
                      className="text-orange-500 fill-orange-500"
                    />
                  </div>
                </div>

                <p className="text-white/80 leading-relaxed mb-3">
                  {review.comment}
                </p>

                {/* Reply Button (Future Feature) */}
                {/* <button className="text-xs text-orange-500 font-medium hover:underline">
                  Reply to Customer
                </button> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
