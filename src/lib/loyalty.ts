import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * AKUMA JOKI — Loyalty Points System (Feature 2)
 *
 * Pure frontend zustand store with localStorage persist.
 * Points: 100 per order, 50 per review, 25 per referral
 * Tiers: Bronze (0), Silver (500), Gold (1500), Platinum (3000), Diamond (5000)
 */

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3000,
  diamond: 5000,
};

export const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
  diamond: "#b9f2ff",
};

export const TIER_ICONS: Record<LoyaltyTier, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  diamond: "💠",
};

export function getTier(points: number): LoyaltyTier {
  if (points >= TIER_THRESHOLDS.diamond) return "diamond";
  if (points >= TIER_THRESHOLDS.platinum) return "platinum";
  if (points >= TIER_THRESHOLDS.gold) return "gold";
  if (points >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export function getNextTier(points: number): { tier: LoyaltyTier; threshold: number; remaining: number } | null {
  const tiers: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];
  const current = getTier(points);
  const idx = tiers.indexOf(current);
  if (idx === tiers.length - 1) return null; // already max
  const next = tiers[idx + 1];
  const threshold = TIER_THRESHOLDS[next];
  return { tier: next, threshold, remaining: threshold - points };
}

type LoyaltyState = {
  points: number;
  totalEarned: number;
  history: { id: string; amount: number; reason: string; ts: number }[];
  _hasHydrated: boolean;
  addPoints: (amount: number, reason: string) => void;
  reset: () => void;
  setHasHydrated: (v: boolean) => void;
};

export const useLoyalty = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      points: 0,
      totalEarned: 0,
      history: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      addPoints: (amount, reason) => {
        const id = `lp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        set((s) => ({
          points: s.points + amount,
          totalEarned: s.totalEarned + amount,
          history: [{ id, amount, reason, ts: Date.now() }, ...s.history].slice(0, 50),
        }));
      },
      reset: () => set({ points: 0, totalEarned: 0, history: [] }),
    }),
    {
      name: "akuma-loyalty",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
