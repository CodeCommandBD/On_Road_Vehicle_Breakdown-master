"use client";

import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Star, Clock, DollarSign } from "lucide-react";

export default function FilterPanel({ filters, onChange, className }) {
  const t = useTranslations("Search");
  const [priceRange, setPriceRange] = useState(filters.priceRange || [0, 5000]);

  // Debounce price range updates
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, priceRange });
    }, 500);
    return () => clearTimeout(timer);
  }, [priceRange]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          {t("priceRange")}
        </h3>
        <Slider
          defaultValue={[0, 5000]}
          max={10000}
          step={100}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>৳{priceRange[0]}</span>
          <span>৳{priceRange[1]}+</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          {t("minRating")}
        </h3>
        <div className="flex gap-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => onChange({ ...filters, minRating: rating })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filters.minRating === rating
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {rating}+ ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="open-now"
            className="text-white flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-blue-400" />
            {t("openNow")}
          </Label>
          <Switch
            id="open-now"
            checked={filters.openNow}
            onCheckedChange={(checked) =>
              onChange({ ...filters, openNow: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="verified" className="text-white">
            {t("verifiedOnly")}
          </Label>
          <Switch
            id="verified"
            checked={filters.isVerified}
            onCheckedChange={(checked) =>
              onChange({ ...filters, isVerified: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
