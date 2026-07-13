"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X, Check } from "lucide-react";

const CONSENT_COOKIE = "akuma-cc";
const CONSENT_DAYS = 365; // 1 year

/**
 * CookieConsent — banner GDPR-style yang muncul sekali di bagian bawah.
 *
 * 🔒 PERSISTENT: Pakai document.cookie dengan max-age 1 tahun.
 *    TIDAK pakai localStorage (supaya tidak ke-clear oleh cache-bust/clear-cache).
 *    Setelah user Accept/Decline → cookie diset → banner TIDAK muncul lagi
 *    meski versi app berubah, meski localStorage di-clear.
 */
function setCookie(name: string, value: string, days: number) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  } catch { /* ignore */ }
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Cek cookie (bukan localStorage) — persistent selamanya
    const consent = getCookie(CONSENT_COOKIE);
    if (!consent) {
      // delay 3 detik agar tidak ganggu first paint
      const t = setTimeout(() => {
        setShow(true);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    setCookie(CONSENT_COOKIE, JSON.stringify({ accepted: true, at: Date.now() }), CONSENT_DAYS);
    setShow(false);
  };

  const handleDecline = () => {
    setCookie(CONSENT_COOKIE, JSON.stringify({ accepted: false, at: Date.now() }), CONSENT_DAYS);
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
