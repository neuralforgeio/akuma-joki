"use client";

import { useEffect, useRef } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { SYNCED_UPDATED_AT } from "@/lib/games-data";

/**
 * useAutoSync — polling data dari server (GitHub raw via /api/synced-data)
 * setiap 60 detik, compare `updatedAt` dengan local, update state jika beda.
 *
 * Cara kerja:
 * 1. Saat mount: fetch /api/synced-data, compare updatedAt
 * 2. Jika beda → call syncFromServer(data) → state update (games, reviews, about, dll)
 * 3. Set interval 60 detik untuk re-check
 * 4. Cleanup interval saat unmount
 *
 * Anti-loop: syncFromServer TIDAK memanggil triggerSync, jadi tidak push balik ke GitHub.
 *
 * Fallback: jika fetch gagal, silent skip (tidak throw).
 */

const POLL_INTERVAL = 60_000; // 60 detik

export function useAutoSync() {
  const syncFromServer = useAdminStore((s) => s.syncFromServer);
  const lastUpdatedAt = useRef<string | null>(SYNCED_UPDATED_AT);

  useEffect(() => {
    let active = true;

    const checkForUpdates = async () => {
      try {
        const res = await fetch("/api/synced-data", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!json.ok || !json.data) return;

        const serverUpdatedAt = json.updatedAt;
        if (serverUpdatedAt && serverUpdatedAt !== lastUpdatedAt.current) {
          lastUpdatedAt.current = serverUpdatedAt;
          syncFromServer(json.data);
        }
      } catch {
        // silent fail — network error, server down, dll
      }
    };

    // Initial check after 3s (let page finish hydration first)
    const initialTimer = setTimeout(checkForUpdates, 3000);

    // Polling interval
    const interval = setInterval(checkForUpdates, POLL_INTERVAL);

    // Also check when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncFromServer]);
}
