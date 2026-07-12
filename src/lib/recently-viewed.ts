/**
 * AKUMA JOKI — Recently Viewed Items (per-device, localStorage)
 *
 * Track 10 item terakhir yang dilihat user di halaman store.
 * Pakai localStorage (per-device) — oke untuk feature ini karena
 * user expectation: "yang saya lihat di device ini".
 *
 * Bukan data sync cross-device (berbeda dari games/reviews/about
 * yang sync via GitHub).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentlyViewedItem = {
  id: string;
  gameSlug: string;
  gameName: string;
  gameEmoji: string;
  gameAccent: string;
  productName: string;
  priceLabel: string;
  viewedAt: number;
};

type RecentlyViewedState = {
  items: RecentlyViewedItem[];
  addViewed: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clearAll: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
};

const MAX_ITEMS = 10;

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      addViewed: (item) => {
        set((s) => {
          // Remove duplicate (same id) → prepend new
          const filtered = s.items.filter((i) => i.id !== item.id);
          const next = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
          return { items: next };
        });
      },
      clearAll: () => set({ items: [] }),
    }),
    {
      name: "akuma-recently-viewed",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
