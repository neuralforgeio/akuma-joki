"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

/**
 * UpdateNotifier — deteksi versi baru tanpa reload manual.
 *
 * Cara kerja:
 * 1. Polling /version.json setiap 60 detik
 * 2. Jika BUILD_VERSION berubah → tampilkan toast "Update tersedia!"
 * 3. User klik "Update" → reload page
 * 4. AutoRefresh component (sudah ada) akan clear stale cache & load versi baru
 *
 * Alternative: Service Worker push notification (butuh HTTPS, more complex)
 * Untuk pure frontend di Vercel, polling /version.json adalah approach terbaik.
 */

const VERSION_URL = "/api/version";
const POLL_INTERVAL = 60000; // 60 detik
const DISMISS_KEY = "akuma-update-dismissed";

export function UpdateNotifier() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let currentVersion: string | null = null;

    // Fetch current version first
    const fetchVersion = async () => {
      try {
        const res = await fetch(VERSION_URL, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const newVersion = data.buildId || data.version || "unknown";

        if (currentVersion === null) {
          // First fetch — store current version
          currentVersion = newVersion;
        } else if (newVersion !== currentVersion) {
          // Version changed — update available!
          // Check if user dismissed this specific version
          const dismissedVersion = sessionStorage.getItem(DISMISS_KEY);
          if (dismissedVersion !== newVersion) {
            setHasUpdate(true);
          }
        }
      } catch {
        // Network error — ignore, will retry
      }
    };

    // Initial fetch
    fetchVersion();

    // Poll every 60s
    const interval = setInterval(fetchVersion, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    // Clear dismiss flag & reload
    sessionStorage.removeItem(DISMISS_KEY);
    window.location.reload();
  };

  const handleDismiss = async () => {
    setHasUpdate(false);
    setDismissed(true);
    // Remember dismissal for this session
    try {
      const res = await fetch(VERSION_URL, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem(DISMISS_KEY, data.buildId || data.version || "unknown");
      }
    } catch {
      /* ignore */
    }
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
            <button
              onClick={handleUpdate}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-2 text-xs font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all"
            >
              <RefreshCw className="size-3.5" /> Update
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Tutup notifikasi"
              className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
