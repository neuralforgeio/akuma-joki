"use client";

import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * KeyboardShortcutsHint — overlay yang muncul saat user tekan "?"
 * Menampilkan daftar keyboard shortcuts yang tersedia.
 *
 * Shortcuts aktif:
 * - Ctrl+K / Cmd+K → buka search (sudah ada di navbar)
 * - Esc → tutup modal/dropdown
 * - ? → buka overlay ini
 * - G lalu H → ke Home
 * - G lalu S → ke Store (first game)
 * - G lalu C → ke Checkout
 * - G lalu W → ke Wishlist
 * - G lali A → ke About
 * - G lalu T → ke Track Order
 */
const SHORTCUTS = [
  { keys: ["Ctrl", "K"], desc: "Buka pencarian" },
  { keys: ["Esc"], desc: "Tutup modal / dropdown" },
  { keys: ["?"], desc: "Tampilkan bantuan ini" },
  { keys: ["G", "H"], desc: "Ke Home" },
  { keys: ["G", "S"], desc: "Ke Store (game pertama)" },
  { keys: ["G", "C"], desc: "Ke Checkout" },
  { keys: ["G", "W"], desc: "Ke Wishlist" },
  { keys: ["G", "A"], desc: "Ke About" },
  { keys: ["G", "T"], desc: "Ke Track Order" },
];

export function KeyboardShortcutsHint() {
  const [open, setOpen] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignore jika sedang typing di input/textarea
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (e.key === "Escape") setOpen(false);
        return;
      }

      // ? → toggle overlay
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // Esc → close
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      // G + next key → navigation
      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey) {
        setLastKey("g");
        setTimeout(() => setLastKey(null), 1000);
        return;
      }

      if (lastKey === "g") {
        const map: Record<string, string> = {
          h: "/",
          s: "/store/blox-fruits",
          c: "/checkout",
          w: "/wishlist",
          a: "/about",
          t: "/track-order",
        };
        const target = map[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          window.location.href = target;
        }
        setLastKey(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lastKey]);

  return (
    <>
      {/* Floating hint button (bottom-right) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
        className="fixed bottom-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-all"
      >
        <Keyboard className="size-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-nav-strong rounded-3xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="size-5 text-violet-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Tutup"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-2">
                {SHORTCUTS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-zinc-400">{s.desc}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, j) => (
                        <span key={j} className="inline-flex items-center justify-center min-w-7 h-6 px-2 rounded-md border border-white/15 bg-white/5 text-[10px] font-mono text-zinc-200">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 pt-4 border-t border-white/8 text-[10px] text-zinc-600">
                Tip: Tekan <kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-white/5 text-[10px] font-mono">?</kbd> kapan saja untuk bantuan.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
