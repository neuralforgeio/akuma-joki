"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

/**
 * UpdateNotifier — deteksi versi baru tanpa reload manual.
 *
 * Fix: hanya show toast jika buildId BERUBAH dari yang pertama kali di-fetch.
 * Tidak show toast setiap poll — hanya saat ada perubahan nyata.
 */
const VERSION_URL = "/api/version";
const POLL_INTERVAL = 120000; // 2 menit (kurangi frekuensi)
const DISMISS_KEY = "akuma-update-dismissed";
const STORED_BUILD_KEY = "akuma-last-build-id";

export function UpdateNotifier() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const initialBuildIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch(VERSION_URL, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const newBuildId = data.buildId || data.version || "unknown";

        if (initialBuildIdRef.current === null) {
          // First fetch — store initial build ID, DON'T show toast
          initialBuildIdRef.current = newBuildId;
          // Also check if we stored a different build from a previous session
          const storedBuild = sessionStorage.getItem(STORED_BUILD_KEY);
          if (storedBuild && storedBuild !== newBuildId) {
            // Build changed since last session — but don't auto-show,
            // let AutoRefresh handle it. Only show if user hasn't dismissed.
            const dismissedBuild = sessionStorage.getItem(DISMISS_KEY);
            if (dismissedBuild !== newBuildId) {
              setHasUpdate(true);
            }
          }
          sessionStorage.setItem(STORED_BUILD_KEY, newBuildId);
        } else if (newBuildId !== initialBuildIdRef.current) {
          // Build changed DURING this session — show toast!
          const dismissedBuild = sessionStorage.getItem(DISMISS_KEY);
          if (dismissedBuild !== newBuildId) {
            setHasUpdate(true);
          }
        }
      } catch {
        // Network error — ignore
      }
    };

    // Initial fetch after 5s (don't immediately on load)
    const initialTimer = setTimeout(fetchVersion, 5000);
    const interval = setInterval(fetchVersion, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const handleUpdate = () => {
    sessionStorage.removeItem(DISMISS_KEY);
    window.location.reload();
  };

  const handleDismiss = () => {
    setHasUpdate(false);
    setDismissed(true);
    try {
      const currentBuild = sessionStorage.getItem(STORED_BUILD_KEY) || "unknown";
      sessionStorage.setItem(DISMISS_KEY, currentBuild);
    } catch { /* ignore */ }
  };

  if (!hasUpdate || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -60 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] max-w-md w-[calc(100%-2rem)]"
        role="alert"
        aria-live="assertive"
      >
        <div className="glass-strong rounded-2xl p-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] border-violet-500/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30">
              <RefreshCw className="size-5 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">Update Tersedia!</p>
              <p className="text-xs text-zinc-400 mt-0.5">Versi baru AKUMA JOKI siap. Klik untuk update.</p>
            </div>
            <button onClick={handleUpdate} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-2 text-xs font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all">
              <RefreshCw className="size-3.5" /> Update
            </button>
            <button onClick={handleDismiss} aria-label="Tutup" className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300">
              <X className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
