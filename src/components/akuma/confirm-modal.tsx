"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, AlertCircle, X } from "lucide-react";
import { useConfirmModal } from "@/lib/confirm-modal";
import { cn } from "@/lib/utils";

const VARIANT_META = {
  danger: { icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  warning: { icon: AlertCircle, color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)" },
  info: { icon: Info, color: "#22d3ee", bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.3)" },
};

export function ConfirmModal() {
  const { open, config, hide } = useConfirmModal();

  if (!config) return null;

  const variant = config.variant || "warning";
  const meta = VARIANT_META[variant];
  const Icon = meta.icon;

  const handleConfirm = () => {
    config.onConfirm();
    hide();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={hide}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-nav-strong rounded-3xl max-w-sm w-full p-6"
            style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}
          >
            {/* Icon */}
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2"
              style={{ backgroundColor: meta.bg, borderColor: meta.border }}
            >
              <Icon className="size-7" style={{ color: meta.color }} />
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-zinc-100 text-center mb-2">{config.title}</h2>

            {/* Message */}
            <p className="text-sm text-zinc-500 text-center mb-6 whitespace-pre-line">{config.message}</p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all",
                  variant === "danger" && "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400",
                  variant === "warning" && "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400",
                  variant === "info" && "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400",
                )}
              >
                {config.confirmLabel || "Konfirmasi"}
              </button>
              <button
                onClick={hide}
                className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-all"
              >
                {config.cancelLabel || "Batal"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
