import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * AKUMA JOKI — Achievement Badges System (Feature 7)
 *
 * Pure frontend zustand store with localStorage persist.
 *
 * Badges:
 * - "first_order" — First Order (complete first order)
 * - "five_orders" — 5 Orders (complete 5 orders)
 * - "first_review" — First Review (write first review)
 * - "wishlist_master" — Wishlist Master (5 items in wishlist)
 * - "cart_full" — Cart Full (cart has 5 items)
 * - "loyal_customer" — Loyal Customer (1000+ loyalty points)
 */

export type AchievementId =
  | "first_order"
  | "five_orders"
  | "first_review"
  | "wishlist_master"
  | "cart_full"
  | "loyal_customer";

export type AchievementDef = {
  id: AchievementId;
  icon: string;
  // i18n keys: achievements.<id>, achievements.<id>Desc
  titleKey: string;
  descKey: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_order", icon: "🎯", titleKey: "achievements.firstOrder", descKey: "achievements.firstOrderDesc" },
  { id: "five_orders", icon: "🏅", titleKey: "achievements.fiveOrders", descKey: "achievements.fiveOrdersDesc" },
  { id: "first_review", icon: "⭐", titleKey: "achievements.firstReview", descKey: "achievements.firstReviewDesc" },
  { id: "wishlist_master", icon: "💖", titleKey: "achievements.wishlistMaster", descKey: "achievements.wishlistMasterDesc" },
  { id: "cart_full", icon: "🛒", titleKey: "achievements.cartFull", descKey: "achievements.cartFullDesc" },
  { id: "loyal_customer", icon: "💎", titleKey: "achievements.loyalCustomer", descKey: "achievements.loyalCustomerDesc" },
];

type AchievementsState = {
  unlocked: AchievementId[];
  /** Recently-unlocked achievement to display in toast. Cleared after toast shown. */
  lastUnlocked: { id: AchievementId; ts: number } | null;
  unlock: (id: AchievementId) => void;
  clearLastUnlocked: () => void;
  isUnlocked: (id: AchievementId) => boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
};

export const useAchievements = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      lastUnlocked: null,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      unlock: (id) => {
        if (get().unlocked.includes(id)) return; // already unlocked
        set((s) => ({
          unlocked: [...s.unlocked, id],
          lastUnlocked: { id, ts: Date.now() },
        }));
      },
      clearLastUnlocked: () => set({ lastUnlocked: null }),
      isUnlocked: (id) => get().unlocked.includes(id),
    }),
    {
      name: "akuma-achievements",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Convenience helper: check & unlock achievements based on counts/state.
 * Called from various lifecycle points (after order, after review, etc.)
 */
export function checkAchievements(opts: {
  orderCount?: number;
  reviewCount?: number;
  wishlistCount?: number;
  cartCount?: number;
  loyaltyPoints?: number;
}) {
  const { unlock } = useAchievements.getState();
  if ((opts.orderCount ?? 0) >= 1) unlock("first_order");
  if ((opts.orderCount ?? 0) >= 5) unlock("five_orders");
  if ((opts.reviewCount ?? 0) >= 1) unlock("first_review");
  if ((opts.wishlistCount ?? 0) >= 5) unlock("wishlist_master");
  if ((opts.cartCount ?? 0) >= 5) unlock("cart_full");
  if ((opts.loyaltyPoints ?? 0) >= 1000) unlock("loyal_customer");
}
