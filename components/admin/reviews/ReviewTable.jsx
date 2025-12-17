"use client";

import { useState } from "react";
import { Star, Trash2, CheckCircle, AlertTriangle } from "lucide-react";

const initialReviews = [
  { id: 1, user: "Ahsan Habib", garage: "Master Fix Auto", rating: 5, comment: "Quick service and friendly staff. Highly recommended!", date: "16 Dec 2024", flagged: false },
  { id: 2, user: "Sadia Islam", garage: "Speedy Motors", rating: 2, comment: "Overcharged me for a simple tire fix. Not happy.", date: "15 Dec 2024", flagged: true },
  { id: 3, user: "John Doe", garage: "Dhaka Wheels", rating: 4, comment: "Good work but took longer than expected.", date: "14 Dec 2024", flagged: false },
  { id: 4, user: "Anonymous", garage: "Moto Care", rating: 1, comment: "Terrible experience, rude mechanics.", date: "12 Dec 2024", flagged: true },
];

export default function ReviewTable() {
  const [reviews, setReviews] = useState(initialReviews);

  const handleDelete = (id) => {
    if(confirm("Are you sure you want to delete this review?")) {
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Latest Reviews</h3>
        <div className="text-sm text-white/60">Showing {reviews.length} reviews</div>
      </div>

      <div className="overflow-x-auto">
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
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{review.garage}</td>
                <td className="px-6 py-4 text-white/80">{review.user}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-white/20"} 
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-white/70 text-sm relative">
                  {review.flagged && (
                    <span className="absolute -top-2 left-4 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded uppercase font-bold flex items-center gap-1">
                      <AlertTriangle size={10} /> Flagged
                    </span>
                  )}
                  {review.comment}
                </td>
                <td className="px-6 py-4 text-white/40 text-xs">{review.date}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
