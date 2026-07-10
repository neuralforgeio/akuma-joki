"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, Eye, Star } from "lucide-react";

/**
 * SocialProofNotification — floating toast yang muncul periodik di pojok kiri bawah.
 * Menampilkan notifikasi social proof: "X orang lagi lihat game ini" / "Y baru order".
 * Tujuan: boost trust & urgency (FOMO) untuk web joki & store.
 *
 * - Muncul setiap 15-25 detik (random)
 * - Tampil 5 detik, lalu fade out
 * - Random pilih dari pool notifikasi
 * - Pixel-art themed (dark bg, neon accent, pixel-corner)
 * - Bisa di-dismiss (klik X)
 */

type NotifType = "viewing" | "ordered" | "review";

type Notification = {
  type: NotifType;
  text: string;
  game: string;
  emoji: string;
  accent: string;
  time: string;
};

const NOTIFICATIONS: Notification[] = [
  { type: "viewing", text: "orang lagi lihat", game: "Blox Fruits", emoji: "⚔️", accent: "#a020f0", time: "beberapa detik lalu" },
  { type: "viewing", text: "orang lagi lihat", game: "Expedition Antarctica", emoji: "🏔️", accent: "#7fd4ff", time: "1 menit lalu" },
  { type: "viewing", text: "orang lagi lihat", game: "Retail Tycoon 2", emoji: "🏪", accent: "#ffd166", time: "2 menit lalu" },
  { type: "ordered", text: "baru saja order", game: "Blox Fruits", emoji: "⚔️", accent: "#a020f0", time: "baru saja" },
  { type: "ordered", text: "baru saja order", game: "Expedition Antarctica", emoji: "🏔️", accent: "#7fd4ff", time: "3 menit lalu" },
  { type: "ordered", text: "baru saja order", game: "Retail Tycoon 2", emoji: "🏪", accent: "#ffd166", time: "5 menit lalu" },
  { type: "review", text: "memberi rating 5 bintang", game: "Blox Fruits", emoji: "⚔️", accent: "#a020f0", time: "baru saja" },
  { type: "review", text: "memberi rating 5 bintang", game: "Expedition Antarctica", emoji: "🏔️", accent: "#7fd4ff", time: "10 menit lalu" },
];

const NAMES = [
  "Rizky", "Andi", "Budi", "Dewa", "Fajar", "Gilang", "Hadi", "Ilham",
  "Joko", "Kevin", "Lukman", "Rama", "Surya", "Toni", "Yoga", "Zaki",
  "Aldi", "Bagas", "Candra", "Dimas", "Eka", "Farhan", "Galih", "Hendra",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function SocialProofNotification() {
  const [current, setCurrent] = useState<Notification | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    const showNotif = () => {
      const notif = pickRandom(NOTIFICATIONS);
      // tambah count + name ke text
      const count = notif.type === "viewing" ? randomCount(3, 27) : 1;
      const name = pickRandom(NAMES);
      const enriched: Notification = {
        ...notif,
        text:
          notif.type === "viewing"
            ? `${count} ${notif.text} ${notif.game}`
            : `${name} ${notif.text} ${notif.game}`,
      };
      setCurrent(enriched);

      // hide setelah 5 detik
      timeout = setTimeout(() => {
        setCurrent(null);
      }, 5000);
    };

    // first notif setelah 8 detik
    const initialDelay = setTimeout(() => {
      showNotif();
      // repeat setiap 15-25 detik (random)
      interval = setInterval(showNotif, randomCount(15000, 25000));
    }, 8000);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed || !current) return null;

  const Icon = current.type === "viewing" ? Eye : current.type === "ordered" ? ShoppingCart : Star;
  const iconColor =
    current.type === "viewing" ? "#7fd4ff" : current.type === "ordered" ? "#6ee7b7" : "#ffd166";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -40, y: 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-20 left-4 z-[9998] max-w-[16rem] sm:bottom-6"
        role="status"
        aria-live="polite"
      >
        <div className="relative border-2 border-[#2a2436] bg-[#121017] pixel-corner p-3 shadow-[0_0_0_2px_#0a0a0a,0_8px_24px_-8px_rgba(0,0,0,0.8)]">
          {/* dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Tutup notifikasi"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center border border-[#ff3b6b]/50 bg-[#0a0a0a] text-[#ff3b6b] text-[10px] hover:bg-[#ff3b6b]/10"
            style={{ borderRadius: 0 }}
          >
            ✕
          </button>

          <div className="flex items-start gap-2.5">
            {/* icon */}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center border-2 pixel-corner"
              style={{ borderColor: iconColor, color: iconColor, background: `${iconColor}11` }}
            >
              <Icon className="size-4" />
            </span>

            {/* content */}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#e5e5e5] leading-snug">
                <span className="font-semibold">{current.emoji} </span>
                {current.text}
              </p>
              <p className="font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8] mt-1">
                {current.time} · AKUMA JOKI
              </p>
            </div>
          </div>

          {/* progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full"
              style={{ background: iconColor }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
