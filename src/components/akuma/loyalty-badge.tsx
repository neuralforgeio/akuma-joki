"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, ChevronUp } from "lucide-react";
import { useLoyalty, getTier, getNextTier, TIER_COLORS, TIER_ICONS } from "@/lib/loyalty";
import { useI18n } from "@/lib/i18n";

const TIER_LABEL_KEY: Record<string, string> = {
  bronze: "loyalty.tierBronze",
  silver: "loyalty.tierSilver",
  gold: "loyalty.tierGold",
  platinum: "loyalty.tierPlatinum",
  diamond: "loyalty.tierDiamond",
};

/**
 * LoyaltyBadge — small badge shown in navbar.
 * Shows crown icon + current tier + points. Click → expand panel.
 *
 * To avoid SSR/client hydration mismatch (loyalty store persists to localStorage),
 * we render a placeholder until after mount.
 */
export function LoyaltyBadge() {
  const points = useLoyalty((s) => s.points);
  const hydrated = useLoyalty((s) => s._hasHydrated);
  const t = useI18n((s) => s.t);
  useI18n((s) => s.lang);
  const [open, setOpen] = useState(false);
  // Track if we've mounted on client (avoids hydration mismatch from
  // localStorage-backed loyalty points differing from SSR default)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || !hydrated) {
    // Render placeholder to keep navbar layout stable during SSR/first paint
    return (
      <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-500 opacity-50" aria-hidden>
        <Crown className="size-4" />
      </div>
    );
  }

  const tier = getTier(points);
  const next = getNextTier(points);
  const tierColor = TIER_COLORS[tier];
  const tierIcon = TIER_ICONS[tier];
  const tierFloor = tier === "bronze" ? 0 :
    tier === "silver" ? 500 :
    tier === "gold" ? 1500 :
    tier === "platinum" ? 3000 : 5000;
  const progressPct = next
    ? Math.min(100, ((points - tierFloor) / (next.threshold - tierFloor)) * 100)
    : 100;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("loyalty.points")}
        title={`${t(TIER_LABEL_KEY[tier])} · ${points} ${t("loyalty.points")}`}
        className="hidden sm:flex items-center gap-1.5 h-9 rounded-xl border px-2.5 text-xs font-medium transition-all"
        style={{
          borderColor: tierColor + "50",
          background: tierColor + "12",
          color: tierColor,
        }}
      >
        <span className="text-sm leading-none">{tierIcon}</span>
        <span className="font-pixel text-[10px]">{points.toLocaleString()}</span>
        <span className="text-[9px] opacity-70 hidden md:inline">{t("loyalty.points")}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full mt-2 w-72 glass-nav-strong rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)] z-50 overflow-hidden border border-white/10"
            style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 border-b border-white/8"
              style={{ background: `linear-gradient(135deg, ${tierColor}25, transparent)` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tierIcon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: tierColor }}>
                    {t(TIER_LABEL_KEY[tier])}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {points.toLocaleString()} {t("loyalty.points")}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress to next tier */}
            <div className="px-4 py-3 border-b border-white/8">
              {next ? (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-zinc-500">
                      {t("loyalty.nextTier")} {t(TIER_LABEL_KEY[next.tier])} {TIER_ICONS[next.tier]}
                    </p>
                    <p className="text-[10px] font-semibold text-zinc-300">
                      {next.remaining.toLocaleString()} {t("loyalty.points")}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${tierColor}, ${TIER_COLORS[next.tier]})`,
                        boxShadow: `0 0 8px ${tierColor}66`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-center text-amber-400 font-semibold py-1">
                  💎 {t(TIER_LABEL_KEY.diamond)} — Max Tier!
                </p>
              )}
            </div>

            {/* Tier ladder */}
            <div className="px-4 py-3 space-y-1.5">
              {(["bronze", "silver", "gold", "platinum", "diamond"] as const).map((tierKey) => {
                const reached = points >= (tierKey === "bronze" ? 0 :
                  tierKey === "silver" ? 500 :
                  tierKey === "gold" ? 1500 :
                  tierKey === "platinum" ? 3000 : 5000);
                return (
                  <div key={tierKey} className="flex items-center gap-2 text-xs">
                    <span className="text-sm">{TIER_ICONS[tierKey]}</span>
                    <span className="flex-1 text-zinc-300">{t(TIER_LABEL_KEY[tierKey])}</span>
                    <span className="text-zinc-500">
                      {(tierKey === "bronze" ? 0 :
                        tierKey === "silver" ? 500 :
                        tierKey === "gold" ? 1500 :
                        tierKey === "platinum" ? 3000 : 5000).toLocaleString()} pts
                    </span>
                    {reached && <ChevronUp className="size-3 text-green-400 rotate-90" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
