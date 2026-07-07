import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectedOrder = {
  gameSlug: string;
  gameName: string;
  productId: string;
  productName: string;
  priceLabel: string;
  price: number;
  category?: string;
};

type AkumaState = {
  order: SelectedOrder | null;
  _hasHydrated: boolean;
  selectProduct: (order: SelectedOrder) => void;
  clearOrder: () => void;
  setHasHydrated: (v: boolean) => void;
};

/**
 * Navigation is now handled by Next.js App Router (next/link + router.push).
 * This store ONLY persists the selected order so the checkout page can read it.
 */
export const useAkumaStore = create<AkumaState>()(
  persist(
    (set) => ({
      order: null,
      _hasHydrated: false,
      selectProduct: (order) => set({ order }),
      clearOrder: () => set({ order: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "akuma-joki-store",
      partialize: (s) => ({ order: s.order }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** Convenience hook for components that just need to know when client store is ready. */
export function useHasHydrated() {
  return useAkumaStore((s) => s._hasHydrated);
}
