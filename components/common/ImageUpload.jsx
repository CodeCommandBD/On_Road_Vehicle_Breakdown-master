import { useState } from "react";
import axios from "axios";
import { Upload, X, ExternalLink, Wrench } from "lucide-react";
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
  const [deleting, setDeleting] = useState(false);

  const getPublicIdFromUrl = (url) => {
    try {
      if (!url) return null;

      const uploadIndex = url.indexOf("/upload/");
      if (uploadIndex === -1) return null;

      // Get part after /upload/
      let publicId = url.substring(uploadIndex + 8);

      // Remove version prefix if exists (e.g., v123456789/)
      if (publicId.match(/^v\d+\//)) {
        publicId = publicId.replace(/^v\d+\//, "");
      }

      // Remove extension (everything after the last dot)
      const lastDotIndex = publicId.lastIndexOf(".");
      if (lastDotIndex !== -1) {
        publicId = publicId.substring(0, lastDotIndex);
      }

      return publicId;
    } catch (error) {
      console.error("Error parsing public ID:", error);
      return null;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    // Keep track of the old value to delete later
    const oldUrl = value;

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        onChange(res.data.url);
        toast.success("File uploaded successfully");

        // If there was an old image, delete it now
        if (oldUrl) {
          const publicId = getPublicIdFromUrl(oldUrl);
          if (publicId) {
            axios
              .delete("/api/upload", { data: { public_id: publicId } })
              .catch((err) =>
                console.error("Failed to auto-delete old image:", err)
              );
          }
        }
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

  const handleClear = async () => {
    if (!value) return;

    // Check if it's a cloudinary URL to attempt deletion
    const publicId = getPublicIdFromUrl(value);

    if (publicId) {
      setDeleting(true);
      try {
        const res = await axios.delete("/api/upload", {
          data: { public_id: publicId },
        });

        if (res.data.success) {
          toast.info("Image deleted from cloud");
        } else {
          // Show error to user so they know it didn't strictly work
          toast.warning(
            `Cloud delete failed: ${res.data.message || "Unknown error"}`
          );
        }
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to communicate with server for delete");
      } finally {
        setDeleting(false);
      }
    } else {
      toast.warning("Could not identify image ID for cloud deletion");
    }

    onChange("");
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
                onClick={handleClear}
                disabled={deleting}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Clear & Delete"
              >
                {deleting ? (
                  <Wrench size={16} className="animate-spin" />
                ) : (
                  <X size={16} />
                )}
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
            <Wrench className="animate-spin w-5 h-5 text-orange-500" />
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
