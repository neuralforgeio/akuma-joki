import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Wishlist store — simpan item joki favorit (localStorage).
 * Pure frontend, no backend needed.
 */
type WishlistItem = {
  gameSlug: string;
  gameName: string;
  productId: string;
  productName: string;
  priceLabel: string;
  emoji: string;
  addedAt: number;
};

type WishlistState = {
  items: WishlistItem[];
  _hasHydrated: boolean;
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          set((s) => ({ items: s.items.filter((i) => i.productId !== item.productId) }));
        } else {
          set((s) => ({ items: [...s.items, item] }));
        }
      },
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      has: (productId) => get().items.some((i) => i.productId === productId),
      clear: () => set({ items: [] }),
    }),
    {
      name: "akuma-wishlist",
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
    }
  )
);
