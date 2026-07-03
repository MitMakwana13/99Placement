"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-pastel-green border-pastel-green-ink/10 text-pastel-green-ink";
      case "error":
        return "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400";
      case "warning":
        return "bg-pastel-yellow border-pastel-yellow-ink/10 text-pastel-yellow-ink";
      case "info":
      default:
        return "bg-pastel-blue border-pastel-blue-ink/10 text-pastel-blue-ink";
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />;
      case "error":
        return <AlertCircle className="h-4.5 w-4.5 shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4.5 w-4.5 shrink-0" />;
      case "info":
      default:
        return <Info className="h-4.5 w-4.5 shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast container floating on screen */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start justify-between gap-3 p-4 rounded-2xl border shadow-xl pointer-events-auto transition-all duration-300 animate-slide-up ${getToastStyle(
              t.type
            )}`}
          >
            <div className="flex gap-2.5 items-start">
              {getToastIcon(t.type)}
              <span className="text-xs font-semibold leading-relaxed">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-all shrink-0 text-current opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
