"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy } from "lucide-react";
import { useAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { useI18n } from "@/lib/i18n";

/**
 * AchievementToast — shows a celebratory toast when an achievement is unlocked.
 * Mount globally (deferred) in MainLayout.
 *
 * Feature 7.
 */
export function AchievementToast() {
  const lastUnlocked = useAchievements((s) => s.lastUnlocked);
  const clearLastUnlocked = useAchievements((s) => s.clearLastUnlocked);
  const t = useI18n((s) => s.t);
  useI18n((s) => s.lang);
  const [visible, setVisible] = useState(false);
  const lastHandledRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastUnlocked) return;
    // Avoid re-triggering for the same unlock
    if (lastHandledRef.current === lastUnlocked.ts) return;
    lastHandledRef.current = lastUnlocked.ts;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      // Clear after exit animation
      setTimeout(clearLastUnlocked, 300);
    }, 5000);
    return () => clearTimeout(hideTimer);
  }, [lastUnlocked, clearLastUnlocked]);

  if (!lastUnlocked) return null;

  const ach = ACHIEVEMENTS.find((a) => a.id === lastUnlocked.id);
  if (!ach) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={lastUnlocked.ts}
          initial={{ opacity: 0, y: 80, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-sm"
        >
          <div
            className="glass-nav-strong rounded-3xl p-4 pr-10 border-2 border-amber-400/40 shadow-[0_8px_40px_-8px_rgba(251,191,36,0.6)]"
            style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}
          >
            <button
              onClick={() => setVisible(false)}
              aria-label={t("common.close")}
              className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="size-4" />
            </button>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2, stiffness: 240, damping: 12 }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 border border-amber-400/40 text-2xl"
              >
                {ach.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                  <Trophy className="size-3" /> {t("achievements.unlocked")}
                </p>
                <p className="text-sm font-bold text-zinc-100 mt-0.5 truncate">
                  {t(ach.titleKey)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                  {t(ach.descKey)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
