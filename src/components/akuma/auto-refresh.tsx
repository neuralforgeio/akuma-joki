"use client";

import { useEffect } from "react";

/**
 * AutoRefresh — otomatis clear stale localStorage & sessionStorage saat
 * versi app berubah. User TIDAK perlu manual clear storage untuk dapat
 * update terbaru.
 *
 * Cara kerja:
 * 1. Cek APP_VERSION di localStorage
 * 2. Jika berbeda dari versi saat ini → clear semua storage keys lama
 * 3. Set versi baru
 * 4. Jika user sedang di web saat update → reload page otomatis
 *
 * Versi di-increment setiap kali ada breaking change di data structure.
 */

const APP_VERSION = "v2.0.5"; // increment saat ada breaking change
const VERSION_KEY = "akuma-app-version";
const RELOAD_KEY = "akuma-app-reloaded";

// Keys yang harus di-clear saat version mismatch (TIDAK clear wishlist/reviews
// karena itu user data yang harus persist)
const STALE_KEYS = [
  "akuma-admin-store",
  "akuma-joki-store",
  "akuma-wa-chat-v3",
  "akuma-wa-mute-v3",
  "akuma-wa-auto-v3",
  "akuma-wa-seen-v3",
  "akuma-wa-chat-v2",
  "akuma-wa-mute-v2",
  "akuma-wa-auto-v2",
  "akuma-admin-session",
  "akuma-announcement-dismissed",
  "akuma-visitor-tracked",
  "akuma-cookie-consent",
  "akuma-admin-sidebar-collapsed",
  "akuma-theme",
];

export function AutoRefresh() {
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const wasReloaded = sessionStorage.getItem(RELOAD_KEY);

      if (storedVersion !== APP_VERSION) {
        // Version mismatch → clear stale data
        for (const key of STALE_KEYS) {
          try { localStorage.removeItem(key); } catch { /* ignore */ }
        }
        // Clear sessionStorage too
        try { sessionStorage.clear(); } catch { /* ignore */ }

        // Set new version
        localStorage.setItem(VERSION_KEY, APP_VERSION);

        // Reload page ONCE to apply fresh state (prevent infinite reload via sessionStorage flag)
        if (!wasReloaded) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          return;
        }
      }

      // Clear the reload flag after successful load
      if (wasReloaded) {
        sessionStorage.removeItem(RELOAD_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
