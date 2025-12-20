"use client";

import { useState } from "react";
import { Upload, Loader2, ExternalLink, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function ImageUpload({
  label,
  value,
  onChange,
  placeholder = "Upload or paste URL",
  accept = "image/*,.pdf",
  className = "",
  showPreview = false,
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        onChange(res.data.url);
        toast.success("File uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      // Reset input value to allow selecting same file again
      e.target.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-white/80 text-sm font-medium">{label}</label>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 pr-10 transition-all placeholder:text-white/20"
            placeholder={placeholder}
          />
          {value && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                title="View File"
              >
                <ExternalLink size={16} />
              </a>
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                title="Clear"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <label
          className={`flex items-center justify-center px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all ${
            uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="animate-spin w-5 h-5 text-orange-500" />
          ) : (
            <Upload className="w-5 h-5 text-white/60 hover:text-white" />
          )}
        </label>
      </div>

      {showPreview && value && accept.includes("image") && (
        <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-black/20">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
