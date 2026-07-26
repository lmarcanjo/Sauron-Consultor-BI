/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export function showToast(type: ToastType, message: string) {
  window.dispatchEvent(new CustomEvent("sauron:toast", {
    detail: { type, message }
  }));
}

let toastIdCounter = 0;

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: ToastType; message: string }>;
      const { type, message } = customEvent.detail;
      const id = `${Date.now()}_${toastIdCounter++}`;

      setToasts(prev => [...prev, { id, type, message }].slice(-3)); // máximo 3 na tela

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    window.addEventListener("sauron:toast", handleToastEvent);
    return () => window.removeEventListener("sauron:toast", handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none" role="status" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => {
        const typeStyles = {
          success: "bg-emerald-950 border-emerald-800/80 text-emerald-200",
          error: "bg-rose-950 border-rose-800/80 text-rose-200",
          warning: "bg-amber-950 border-amber-800/80 text-amber-200",
          info: "bg-slate-900 border-slate-700/80 text-slate-200"
        }[toast.type];

        const Icon = {
          success: CheckCircle2,
          error: XCircle,
          warning: AlertTriangle,
          info: Info
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 animate-slide-in ${typeStyles}`}
            style={{
              animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-bold leading-relaxed">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Fechar aviso"
              className="text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
