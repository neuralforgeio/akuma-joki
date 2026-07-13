"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PushNotificationOptIn — component untuk opt-in browser push notifications.
 *
 * Pakai Web Notification API (native browser).
 * TIDAK pakai service worker push (butuh VAPID keys + server).
 * Hanya notif lokal yang dipicu dari app (mis. saat order status berubah).
 *
 * Flow:
 * 1. Saat user scroll 30% page → tampilkan opt-in banner
 * 2. User click "Aktifkan" → request permission
 * 3. Jika granted → simpan flag ke localStorage, tampilkan test notif
 * 4. Jika denied → sembunyikan banner selamanya
 *
 * Notif dipicu dari admin store (saat addReview, addOrder, dll) — optional,
 * bisa di-enable per-event.
 */

const OPT_IN_KEY = "akuma-push-opted-out";

export function PushNotificationOptIn() {
  const [showBanner, setShowBanner] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(Notification.permission);
    try {
      setOptedOut(localStorage.getItem(OPT_IN_KEY) === "1");
    } catch { /* ignore */ }

    // Show banner after user scrolls 30%
    const onScroll = () => {
      if (Notification.permission === "default" && !optedOut) {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrolled > 0.3) {
          setShowBanner(true);
          window.removeEventListener("scroll", onScroll);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [optedOut]);

  const handleEnable = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    setShowBanner(false);
    if (result === "granted") {
      // Test notif
      try {
        new Notification("🔔 Notifikasi AKUMA JOKI Aktif!", {
          body: "Kamu akan dapat notif penting (order, promo, dll) di sini.",
          icon: "/akuma-logo.png",
        });
      } catch { /* ignore */ }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try { localStorage.setItem(OPT_IN_KEY, "1"); } catch { /* ignore */ }
    setOptedOut(true);
  };

  // Expose helper ke window untuk dipanggil dari komponen lain
  useEffect(() => {
    (window as any).akumaNotify = (title: string, body?: string) => {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body, icon: "/akuma-logo.png" });
        } catch { /* ignore */ }
      }
    };
  }, []);

  if (!("Notification" in window) || optedOut || permission !== "default") return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-40"
        >
          <div className="glass-nav-strong rounded-2xl p-4 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30">
                <Bell className="size-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100">Aktifkan Notifikasi?</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                  Dapatkan notif saat order diproses, promo, atau update penting lainnya.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleEnable}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-1.5 text-xs text-white hover:from-violet-500 hover:to-violet-400 transition-all"
                  >
                    <Check className="size-3.5" /> Aktifkan
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-all"
                  >
                    <X className="size-3.5" /> Nanti
                  </button>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-zinc-600 hover:text-zinc-400 transition-colors" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
