import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cart Store — multi-select joki (keranjang belanja).
 * Pure frontend, persist di localStorage.
 *
 * MAX_ITEMS = 5 (maksimal 5 joki per order)
 * add() returns boolean: true jika berhasil, false jika ditolak (limit/duplicate)
 */

export const MAX_CART_ITEMS = 5;

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
  add: (item: CartItem) => boolean; // returns true if added, false if rejected
  remove: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  count: () => number;
  isFull: () => boolean;
  setHasHydrated: (v: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      add: (item) => {
        const items = get().items;
        if (items.some((i) => i.id === item.id)) return false; // no duplicate
        if (items.length >= MAX_CART_ITEMS) return false; // max 5 items
        set((s) => ({ items: [...s.items, item] }));
        return true;
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
      isFull: () => get().items.length >= MAX_CART_ITEMS,
    }),
    {
      name: "akuma-cart",
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
    }
  )
);
