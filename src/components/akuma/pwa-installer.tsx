"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "akuma-pwa-install-dismissed";

/**
 * PWAInstaller — unregister old service workers + show install prompt.
 *
 * IMPORTANT: We removed the service worker (sw.js) because it was caching
 * broken pages. This component now UNREGISTERS any existing service workers
 * to self-heal devices that have the old sw.js cached.
 */
export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // === SELF-HEALING: Unregister ALL existing service workers ===
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log("[PWA] Unregistered old service worker:", registration.scope);
        });
      }).catch(() => {});

      // Also clear all caches
      if ("caches" in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
            console.log("[PWA] Deleted cache:", cacheName);
          });
        }).catch(() => {});
      }
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInstalled(true);
      return;
    }

    // Check dismissed (cookie, 7 days)
    const dismissedCookie = document.cookie.match(new RegExp(`(?:^|; )${DISMISSED_KEY}=([^;]*)`));
    if (dismissedCookie) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowBanner(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
      document.cookie = `${DISMISSED_KEY}=1; expires=${expires}; path=/; SameSite=Lax`;
    } catch { /* ignore */ }
    setDeferredPrompt(null);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setShowBanner(false);
    try {
      const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
      document.cookie = `${DISMISSED_KEY}=1; expires=${expires}; path=/; SameSite=Lax`;
    } catch { /* ignore */ }
    setDeferredPrompt(null);
  };

  if (installed) return null;

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
                <Download className="size-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100">Install AKUMA JOKI</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                  Install app ke HP/komputer untuk akses cepat & experience native.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-1.5 text-xs text-white hover:from-violet-500 hover:to-violet-400 transition-all"
                  >
                    <Download className="size-3.5" /> Install
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
