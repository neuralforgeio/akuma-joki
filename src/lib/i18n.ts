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
  "nav.wishlist": "Wishlist",
  "nav.searchPlaceholder": "Cari game atau joki...",
  "cta.pilihJoki": "Pilih Joki",
  "cta.lihatStore": "Lihat Store",
  "hero.subtitle": "Joki & Store Roblox premium. Naik level, taklukkan raid, dan koleksi senjata langka bareng joki profesional kami. Aman, cepat, harga bersahabat.",
  "section.storeGame": "STORE GAME",
  "section.whyChoose": "KENAPA PILIH AKUMA JOKI?",
  "section.testimonials": "KATA MEREKA YANG SUDAH JOKI",
  "section.recentlyViewed": "BARU SAJA DILIHAT",
  "home.heroSubtitle": "Joki & Store Roblox premium. Naik level, taklukkan raid, dan koleksi senjata langka bareng joki profesional kami. Aman, cepat, harga bersahabat.",
  "home.storeGame": "STORE GAME",
  "home.whyChoose": "KENAPA PILIH AKUMA JOKI?",
  "home.testimonials": "KATA MEREKA YANG SUDAH JOKI",
  "home.testimonialsSub": "Testimoni nyata dari pelanggan kami · Bukan data dummy",
  "home.chooseJoki": "PILIH JOKI",
  "home.viewStore": "LIHAT STORE",
  "home.feature1Title": "Aman & Terpercaya",
  "home.feature1Desc": "Akunmu ditangani joki pro tanpa cheat. Garansi refund jika ada masalah.",
  "home.feature2Title": "Proses Cepat",
  "home.feature2Desc": "Mulai dalam 5 menit setelah order. Update progres real-time via WhatsApp.",
  "home.feature3Title": "Harga Bersahabat",
  "home.feature3Desc": "Mulai dari 2K. DP 50% di awal, pelunasan setelah joki selesai.",
  "home.feature4Title": "Joki Berpengalaman",
  "home.feature4Desc": "Tim joki dengan ribuan order selesai. Ahli di setiap game Roblox.",
  "home.feature5Title": "Support 24/7",
  "home.feature5Desc": "Admin selalu online untuk bantu kamu. Chat langsung via WhatsApp.",
  "home.statsOrders": "Order Selesai",
  "home.statsSupport": "Support",
  "home.statsSafe": "Aman",
  "home.ctaTitle": "Siap Mulai Joki?",
  "home.ctaDesc": "Pilih game favoritmu, lihat item yang tersedia, dan rasakan layanan joki terbaik dari AKUMA JOKI.",
  "home.ctaButton1": "Lihat Game",
  "home.ctaButton2": "Hubungi Kami",
  "dash.title": "Dashboard",
  "dash.welcome": "Selamat datang kembali",
  "dash.quickStats": "Quick Stats",
  "dash.totalGames": "Total Games",
  "dash.totalOrders": "Total Orders",
  "dash.totalReviews": "Total Reviews",
  "dash.totalVisitors": "Total Visitors",
  "dash.recentActivity": "Aktivitas Terbaru",
  "dash.quickActions": "Quick Actions",
  "dash.noActivity": "Belum ada aktivitas",
  "dash.manageGames": "Kelola Games",
  "dash.viewOrders": "Lihat Pesanan",
  "dash.viewReports": "Lihat Laporan",
  "dash.settings": "Pengaturan",
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
  "nav.wishlist": "Wishlist",
  "nav.searchPlaceholder": "Search game or joki...",
  "cta.pilihJoki": "Choose Joki",
  "cta.lihatStore": "View Store",
  "hero.subtitle": "Premium Roblox joki & store. Level up, conquer raids, and collect rare weapons with our pro joki team. Safe, fast, affordable.",
  "section.storeGame": "GAME STORE",
  "section.whyChoose": "WHY CHOOSE AKUMA JOKI?",
  "section.testimonials": "WHAT OUR CUSTOMERS SAY",
  "section.recentlyViewed": "RECENTLY VIEWED",
  "home.heroSubtitle": "Premium Roblox joki & store. Level up, conquer raids, and collect rare weapons with our pro joki team. Safe, fast, affordable.",
  "home.storeGame": "GAME STORE",
  "home.whyChoose": "WHY CHOOSE AKUMA JOKI?",
  "home.testimonials": "WHAT OUR CUSTOMERS SAY",
  "home.testimonialsSub": "Real testimonials from our customers · Not dummy data",
  "home.chooseJoki": "CHOOSE JOKI",
  "home.viewStore": "VIEW STORE",
  "home.feature1Title": "Safe & Trusted",
  "home.feature1Desc": "Your account handled by pro joki without cheats. Refund guarantee if any issues.",
  "home.feature2Title": "Fast Process",
  "home.feature2Desc": "Starts within 5 minutes after order. Real-time progress updates via WhatsApp.",
  "home.feature3Title": "Affordable Price",
  "home.feature3Desc": "Starts from 2K. 50% deposit upfront, pay rest after joki complete.",
  "home.feature4Title": "Experienced Joki",
  "home.feature4Desc": "Joki team with thousands of completed orders. Expert in every Roblox game.",
  "home.feature5Title": "24/7 Support",
  "home.feature5Desc": "Admin always online to help you. Chat directly via WhatsApp.",
  "home.statsOrders": "Orders Completed",
  "home.statsSupport": "Support",
  "home.statsSafe": "Safe",
  "home.ctaTitle": "Ready to Start?",
  "home.ctaDesc": "Choose your favorite game, see available items, and experience the best joki service from AKUMA JOKI.",
  "home.ctaButton1": "View Games",
  "home.ctaButton2": "Contact Us",
  "dash.title": "Dashboard",
  "dash.welcome": "Welcome back",
  "dash.quickStats": "Quick Stats",
  "dash.totalGames": "Total Games",
  "dash.totalOrders": "Total Orders",
  "dash.totalReviews": "Total Reviews",
  "dash.totalVisitors": "Total Visitors",
  "dash.recentActivity": "Recent Activity",
  "dash.quickActions": "Quick Actions",
  "dash.noActivity": "No activity yet",
  "dash.manageGames": "Manage Games",
  "dash.viewOrders": "View Orders",
  "dash.viewReports": "View Reports",
  "dash.settings": "Settings",
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
