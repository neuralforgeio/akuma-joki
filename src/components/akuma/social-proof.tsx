"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * SocialProof — bottom-left toast notifications showing fake "user just ordered" events.
 * Pure frontend, no backend. Random names + random items.
 *
 * Feature 1.
 */

const NAMES = [
  "Rizky", "Andi", "Putri", "Dimas", "Sari", "Fajar", "Budi", "Citra",
  "Reza", "Wulan", "Galih", "Tika", "Yoga", "Maya", "Aldi", "Vina",
  "Bayu", "Dewi", "Rama", "Indah", "Farhan", "Nadia", "Eko", "Lina",
  "Joko", "Sinta", "Yusuf", "Rina", "Hadi", "Mega",
];

const ACTIONS = [
  { emoji: "🔥", item: "200 Level (Blox Fruits)", game: "Blox Fruits" },
  { emoji: "⚔️", item: "CDK (Blox Fruits)", game: "Blox Fruits" },
  { emoji: "🌀", item: "Raid Full Skill (Blox Fruits)", game: "Blox Fruits" },
  { emoji: "🏔️", item: "Muncak 1-25 (Antarctica)", game: "Expedition Antarctica" },
  { emoji: "🧭", item: "NPC All Misi (Antarctica)", game: "Expedition Antarctica" },
  { emoji: "🏪", item: "Main Sampai Pro (Tycoon 2)", game: "Retail Tycoon 2" },
  { emoji: "📈", item: "300 Level (Blox Fruits)", game: "Blox Fruits" },
  { emoji: "🗡️", item: "SG (Blox Fruits)", game: "Blox Fruits" },
];

const LOCATIONS = [
  "Jakarta", "Bandung", "Surabaya", "Medan", "Yogyakarta",
  "Semarang", "Bekasi", "Tangerang", "Depok", "Bogor",
  "Malang", "Solo", "Palembang", "Makassar", "Denpasar",
];

type Proof = {
  id: number;
  name: string;
  action: typeof ACTIONS[number];
  location: string;
  ts: number;
};

export function SocialProof() {
  const t = useI18n((s) => s.t);
  useI18n((s) => s.lang);
  const [proof, setProof] = useState<Proof | null>(null);
  const [visible, setVisible] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let hideTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const showOne = () => {
      if (!mounted) return;
      const id = ++idRef.current;
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      setProof({ id, name, action, location, ts: Date.now() });
      setVisible(true);

      // Auto-dismiss after 5s
      hideTimer = setTimeout(() => {
        if (!mounted) return;
        setVisible(false);
        // Wait for exit animation, then schedule next
        nextTimer = setTimeout(showOne, 15000 + Math.random() * 15000); // 15-30s
      }, 5000);
    };

    // Initial delay 8s
    const initial = setTimeout(showOne, 8000);

    return () => {
      mounted = false;
      clearTimeout(initial);
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && proof && (
        <motion.div
          key={proof.id}
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="fixed bottom-4 left-4 z-[9997] hidden sm:block max-w-xs"
        >
          <div
            className="glass-nav-strong rounded-2xl p-3 pr-9 border border-violet-500/30 shadow-[0_8px_32px_-8px_rgba(139,92,246,0.5)]"
            style={{ backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}
          >
            <button
              onClick={() => setVisible(false)}
              aria-label={t("common.close")}
              className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="size-3.5" />
            </button>
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-lg">
                {proof.action.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">
                  {t("socialProof.title")}
                </p>
                <p className="text-xs text-zinc-200 mt-0.5 leading-snug">
                  <span className="font-semibold">{proof.name}</span> dari{" "}
                  <span className="text-zinc-400">{proof.location}</span> baru saja order
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                  {proof.action.item}
                </p>
                <p className="text-[9px] text-green-400 mt-1 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                  Verified · just now
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
