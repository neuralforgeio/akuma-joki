/**
 * AKUMA JOKI — i18n (Bahasa Indonesia + English)
 *
 * Simple zustand store + dictionary. Tidak pakai next-intl/i18next (overhead).
 * Hanya translate key UI strings. Data konten (games, reviews, dll) tetap ID.
 *
 * Pakai localStorage untuk persist pilihan bahasa.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "id" | "en";

type Dict = Record<string, string>;

const ID: Dict = {
  "nav.home": "Home",
  "nav.about": "About",
  "nav.games": "Games",
  "nav.contact": "Contact",
  "nav.checkout": "Checkout",
  "cta.pilihJoki": "Pilih Joki",
  "cta.lihatStore": "Lihat Store",
  "hero.subtitle": "Joki & Store Roblox premium. Naik level, taklukkan raid, dan koleksi senjata langka bareng joki profesional kami. Aman, cepat, harga bersahabat.",
  "section.storeGame": "STORE GAME",
  "section.whyChoose": "KENAPA PILIH AKUMA JOKI?",
  "section.testimonials": "KATA MEREKA YANG SUDAH JOKI",
  "section.recentlyViewed": "BARU SAJA DILIHAT",
  "cart.addToCart": "Tambah ke Keranjang",
  "cart.inCart": "Di Keranjang",
  "review.writeReview": "Tulis Review",
  "review.rating": "Rating:",
  "review.send": "Kirim Review",
  "review.empty": "Belum ada review. Jadikan yang pertama!",
  "review.title": "Review & Rating",
  "filter.searchPlaceholder": "Cari item... (mis. level, raid, senjata)",
  "filter.allCategories": "Semua Kategori",
  "filter.allTags": "Semua Tag",
  "filter.sortDefault": "Urutkan: Default",
  "filter.sortPriceAsc": "Harga: Rendah → Tinggi",
  "filter.sortPriceDesc": "Harga: Tinggi → Rendah",
  "filter.sortName": "Nama (A-Z)",
  "filter.reset": "Reset",
  "filter.noResults": "Tidak ada item yang cocok dengan filter.",
  "common.back": "Kembali",
  "common.save": "Simpan",
  "common.cancel": "Batal",
  "common.delete": "Hapus",
  "common.clear": "Bersihkan",
};

const EN: Dict = {
  "nav.home": "Home",
  "nav.about": "About",
  "nav.games": "Games",
  "nav.contact": "Contact",
  "nav.checkout": "Checkout",
  "cta.pilihJoki": "Choose Joki",
  "cta.lihatStore": "View Store",
  "hero.subtitle": "Premium Roblox joki & store. Level up, conquer raids, and collect rare weapons with our pro joki team. Safe, fast, affordable.",
  "section.storeGame": "GAME STORE",
  "section.whyChoose": "WHY CHOOSE AKUMA JOKI?",
  "section.testimonials": "WHAT OUR CUSTOMERS SAY",
  "section.recentlyViewed": "RECENTLY VIEWED",
  "cart.addToCart": "Add to Cart",
  "cart.inCart": "In Cart",
  "review.writeReview": "Write a Review",
  "review.rating": "Rating:",
  "review.send": "Send Review",
  "review.empty": "No reviews yet. Be the first!",
  "review.title": "Review & Rating",
  "filter.searchPlaceholder": "Search items... (e.g. level, raid, weapon)",
  "filter.allCategories": "All Categories",
  "filter.allTags": "All Tags",
  "filter.sortDefault": "Sort: Default",
  "filter.sortPriceAsc": "Price: Low → High",
  "filter.sortPriceDesc": "Price: High → Low",
  "filter.sortName": "Name (A-Z)",
  "filter.reset": "Reset",
  "filter.noResults": "No items match your filter.",
  "common.back": "Back",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.clear": "Clear",
};

const DICTS: Record<Lang, Dict> = { id: ID, en: EN };

type I18nState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
};

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      lang: "id",
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setLang: (l) => set({ lang: l }),
      t: (key) => {
        const { lang } = get();
        return DICTS[lang][key] ?? DICTS.id[key] ?? key;
      },
    }),
    {
      name: "akuma-lang",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
