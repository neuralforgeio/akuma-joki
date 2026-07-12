import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cart Store — multi-select joki (keranjang belanja).
 * Pure frontend, persist di localStorage.
 */
export type CartItem = {
  id: string; // unique: gameSlug + productId
  gameSlug: string;
  gameName: string;
  gameEmoji: string;
  productId: string;
  productName: string;
  priceLabel: string;
  price: number;
  category: string;
};

type CartState = {
  items: CartItem[];
  _hasHydrated: boolean;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  count: () => number;
  setHasHydrated: (v: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      add: (item) => {
        if (get().items.some((i) => i.id === item.id)) return; // no duplicate
        set((s) => ({ items: [...s.items, item] }));
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
    }),
    {
      name: "akuma-cart",
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
    }
  )
);
