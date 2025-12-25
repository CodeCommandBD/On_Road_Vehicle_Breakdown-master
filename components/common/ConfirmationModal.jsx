"use client";

import { AlertTriangle, Info, CheckCircle, X } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // 'warning', 'info', 'success'
  isLoading = false,
}) {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle className="w-12 h-12 text-orange-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />,
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
  };

  const colors = {
    warning: "bg-orange-500 hover:bg-orange-600",
    info: "bg-blue-500 hover:bg-blue-600",
    success: "bg-green-500 hover:bg-green-600",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-8 pb-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/5 border border-white/10">
              {icons[type]}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          <p className="text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 p-8 pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors border border-white/10"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-6 py-4 rounded-2xl text-white font-bold transition-all transform active:scale-95 shadow-lg ${
              isLoading ? "bg-gray-600" : colors[type]
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>

        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
