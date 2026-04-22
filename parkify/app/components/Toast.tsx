"use client";

import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

const STYLES: Record<ToastType, { bg: string; icon: string; iconColor: string }> = {
  success: { bg: "bg-green-50 border-green-200",  icon: "check_circle",  iconColor: "text-green-600" },
  error:   { bg: "bg-red-50 border-red-200",      icon: "error",         iconColor: "text-red-600"   },
  info:    { bg: "bg-blue-50 border-blue-200",    icon: "info",          iconColor: "text-blue-600"  },
};

interface ToastProps {
  message: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, type = "success", onHide, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onHide, duration);
    return () => clearTimeout(t);
  }, [onHide, duration]);

  const s = STYLES[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg ${s.bg} animate-in`}
      style={{ animation: "toastIn 0.25s ease-out" }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <span className={`material-symbols-outlined text-[20px] ${s.iconColor}`}>{s.icon}</span>
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      <button
        type="button"
        onClick={onHide}
        className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
