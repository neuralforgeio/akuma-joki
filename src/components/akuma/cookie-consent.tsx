"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X, Check } from "lucide-react";

const CONSENT_KEY = "akuma-cookie-consent";

/**
 * CookieConsent — banner GDPR-style yang muncul sekali di bagian bawah.
 * User pilih: Accept All atau Decline. Persistent di localStorage.
 * Setelah consent diberikan, banner tidak muncul lagi.
 *
 * Tema pixel-art Akuma (dark bg, pixel-corner, neon accent).
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        // delay 3 detik agar tidak ganggu first paint
        const t = setTimeout(() => {
          setShow(true);
        }, 3000);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, at: Date.now() }));
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, at: Date.now() }));
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!mounted || !show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="fixed bottom-0 left-0 right-0 z-[9997] p-4"
        role="dialog"
        aria-label="Cookie consent"
        aria-live="polite"
      >
        <div className="mx-auto max-w-3xl border-2 border-[#a020f0]/60 bg-[#121017] pixel-corner p-4 shadow-[0_0_0_2px_#0a0a0a,0_-8px_28px_-8px_rgba(0,0,0,0.8)] scanlines">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#a020f0] pixel-corner bg-[#a020f0]/10">
              <Cookie className="size-5 text-[#c44bff]" />
            </div>

            {/* text */}
            <div className="min-w-0 flex-1">
              <p className="font-pixel text-[9px] uppercase tracking-wide text-[#c44bff] mb-1.5">
                KAMI PAKAI COOKIES
              </p>
              <p className="text-xs text-[#bcb4c9] leading-relaxed">
                AKUMA JOKI menggunakan cookies untuk meningkatkan pengalaman Anda,
                menyimpan preferensi, dan menganalisis traffic. Dengan terus menggunakan
                situs ini, Anda menyetujui penggunaan cookies sesuai{" "}
                <span className="text-[#c44bff] underline">Kebijakan Privasi</span> kami.
              </p>
            </div>

            {/* buttons */}
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleAccept}
                className="btn-shine flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-pixel text-[8px] uppercase tracking-wide bg-[#a020f0] text-white border-2 border-[#a020f0] px-4 py-2.5 pixel-corner hover:bg-[#c44bff] transition-colors"
              >
                <Check className="size-3" /> Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex items-center justify-center gap-1.5 font-pixel text-[8px] uppercase tracking-wide text-[#9a93a8] border-2 border-[#2a2436] px-4 py-2.5 pixel-corner hover:border-[#ff3b6b] hover:text-[#ff3b6b] transition-colors"
              >
                <X className="size-3" /> Decline
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
