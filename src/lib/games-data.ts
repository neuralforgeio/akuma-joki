export type ProductCategory = {
  id: string;
  name: string;
  icon: string; // emoji used as pixel-ish icon
  items: ProductItem[];
};

export type ProductItem = {
  id: string;
  name: string;
  price: number; // in thousands (K) of in-game currency — displayed as "{price}K"
  priceLabel: string;
  tag?: string;
  /** Short flavor / explanation of what this joki item is. */
  description?: string;
  /** Requirement that must be met before this joki can be done (e.g. "Level 2300 - MAX"). */
  requirement?: string;
};

export type GameNotice = {
  type: "warning" | "info";
  title: string;
  body: string;
};

export type Game = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  accent: string; // hex used for glow accents
  categories: ProductCategory[];
  /** Optional banner shown at the top of a game's store (e.g. Blox Fruits CDK/SG warning). */
  notice?: GameNotice;
};

export const GAMES: Game[] = [
  {
    slug: "blox-fruits",
    name: "Blox Fruits",
    tagline: "Sail. Slice. Dominate.",
    description:
      "Joki leveling, raid, dan senjata langka untuk para Pirate & Marine terkuat di Grand Line.",
    emoji: "⚔️",
    accent: "#a020f0",
    notice: {
      type: "warning",
      title: "⚠️ Penting — CDK & SG",
      body:
        "CDK (Cursed Dual Katana) & SG (Soul Guitar) HANYA bisa dijoki-in jika akunmu sudah berada di Level 2300 - MAX. " +
        "Pastikan level akunmu mencukupi sebelum order kedua senjata ini, ya!",
    },
    categories: [
      {
        id: "leveling",
        name: "LEVELING",
        icon: "📈",
        items: [
          { id: "lvl-100", name: "100 Level", price: 2, priceLabel: "2K", tag: "Starter", description: "Naikkan level akunmu secara bertahap." },
          { id: "lvl-200", name: "200 Level", price: 4, priceLabel: "4K", tag: "Popular", description: "Leveling menengah untuk unlock lebih banyak skill." },
          { id: "lvl-300", name: "300 Level", price: 6, priceLabel: "6K", tag: "Max", description: "Push level maksimal untuk persiapan endgame." },
        ],
      },
      {
        id: "raid",
        name: "RAID",
        icon: "🌀",
        items: [
          { id: "raid-1-10", name: "Raid 1-10", price: 10, priceLabel: "10K", description: "Selesaikan raid tahap 1 sampai 10." },
          { id: "raid-full-skill", name: "Raid Full Skill", price: 10, priceLabel: "10K", tag: "Hot", description: "Raid sampai dapat full skill / mastery." },
        ],
      },
      {
        id: "senjata",
        name: "SENJATA",
        icon: "🗡️",
        items: [
          {
            id: "wpn-cdk",
            name: "CDK",
            price: 20,
            priceLabel: "20K",
            tag: "Legendary",
            description: "Cursed Dual Katana — pedang legendaris pada umumnya, serangan melee tajam khas swordsman.",
            requirement: "Level 2300 - MAX",
          },
          {
            id: "wpn-sg",
            name: "SG",
            price: 10,
            priceLabel: "10K",
            description: "Soul Guitar — pistol berbentuk gitar dengan serangan area (AoE) yang mematikan.",
            requirement: "Level 2300 - MAX",
          },
          { id: "wpn-sh", name: "SH", price: 10, priceLabel: "10K", description: "Senjata langka khusus endgame." },
          { id: "wpn-gh", name: "GH", price: 15, priceLabel: "15K", description: "Senjata tier tinggi untuk PvP & grind." },
        ],
      },
    ],
  },
  {
    slug: "expedition-antarctica",
    name: "Expedition Antarctica",
    tagline: "Survive the Frozen End.",
    description:
      "Taklukkan puncak-puncak beku dan selesaikan semua misi NPC di dunia Antartika yang mematikan.",
    emoji: "🏔️",
    accent: "#7fd4ff",
    categories: [
      {
        id: "expedition",
        name: "EKSPEDISI",
        icon: "🧭",
        items: [
          { id: "muncak-1-10", name: "Muncak 1-10", price: 15, priceLabel: "15K", tag: "Starter", description: "Daki puncak 1 sampai 10." },
          { id: "muncak-1-25", name: "Muncak 1-25", price: 30, priceLabel: "30K", tag: "Full Climb", description: "Daki seluruh puncak 1 sampai 25." },
          {
            id: "npc-all",
            name: "Selesai Semua Misi NPC (dibawah base awal)",
            price: 25,
            priceLabel: "25K",
            tag: "Completionist",
            description: "Selesaikan seluruh misi NPC di area bawah base awal.",
          },
        ],
      },
    ],
  },
  {
    slug: "retail-tycoon-2",
    name: "Retail Tycoon 2",
    tagline: "Build. Sell. Conquer the Market.",
    description:
      "Bangun kerajaan retail-mu dari nol sampai jadi tycoon sejati dengan joki profesional kami.",
    emoji: "🏪",
    accent: "#ffd166",
    categories: [
      {
        id: "tycoon",
        name: "MANAJEMEN TOKO",
        icon: "💼",
        items: [
          { id: "benerin-toko", name: "Benerin Toko", price: 2, priceLabel: "2K", tag: "Quick Fix", description: "Perbaiki & rapikan tata letak tokomu." },
          { id: "main-pro", name: "Main Sampai Pro", price: 5, priceLabel: "5K", tag: "Pro", description: "Mainkan tokomu sampai level pro / profit maksimal." },
        ],
      },
    ],
  },
];

export const WHATSAPP_NUMBER = "6282131561301";

/* ============================ About Content ============================ */
// Konten halaman /about — bisa di-edit developer dari dashboard.
export type AboutFeature = {
  id: string;
  icon: string; // emoji
  title: string;
  desc: string;
};

export type AboutStat = {
  id: string;
  label: string;
  value: string;
};

export type AboutContent = {
  title: string;
  tagline: string;
  description: string;
  mission: string;
  features: AboutFeature[];
  stats: AboutStat[];
  updatedAt?: number;
};

export const DEFAULT_ABOUT: AboutContent = {
  title: "Tentang AKUMA JOKI",
  tagline: "Joki & Store Roblox premium yang aman, cepat, dan terpercaya.",
  description:
    "AKUMA JOKI adalah layanan joki & store Roblox yang lahir dari passion para gamer untuk gamer. " +
    "Kami mengerti betapa berharganya akun, waktu, dan progress kamu — itulah kenapa setiap order ditangani " +
    "oleh joki profesional dengan transparansi penuh, dari proses hingga selesai.",
  mission:
    "Misi kami sederhana: memberikan layanan joki terbaik dengan harga bersahabat, tanpa mengorbankan " +
    "keamanan akun & kenyamanan customer. Setiap pelanggan adalah prioritas, setiap order adalah tanggung jawab.",
  features: [
    { id: "f1", icon: "🛡️", title: "Aman & Terpercaya", desc: "Akun kamu ditangani joki profesional. Tidak ada cheat, tidak ada resiko banned." },
    { id: "f2", icon: "⚡", title: "Proses Cepat", desc: "Order diproses secepat mungkin dengan update progres real-time via WhatsApp." },
    { id: "f3", icon: "💰", title: "Harga Bersahabat", desc: "Harga fair, transparan, tanpa biaya tersembunyi. Cocok untuk pelajar & mahasiswa." },
    { id: "f4", icon: "🎧", title: "CS Responsif", desc: "Admin online 16 jam sehari. Jawaban cepat, ramah, dan selalu siap bantu." },
  ],
  stats: [
    { id: "s1", label: "Order Selesai", value: "1.500+" },
    { id: "s2", label: "Customer Puas", value: "99%" },
    { id: "s3", label: "Game Aktif", value: "5+" },
    { id: "s4", label: "Tahun Pengalaman", value: "3+" },
  ],
};

/* ============================ Contact Report ============================ */
// Type untuk laporan bug dari halaman /contact.
// Disimpan di admin-data.json (GitHub sync) supaya cross-device.
export type ContactReport = {
  id: string;
  name: string;
  contact: string;
  type: "bug" | "suggestion" | "question" | "complaint";
  subject: string;
  description: string;
  page?: string;
  status: "new" | "read" | "resolved";
  createdAt: number;
};

/* ============================ Review ============================ */
// Review/rating dari customer — disimpan di admin-data.json (GitHub sync)
// supaya cross-device. Bukan localStorage.
export type Review = {
  id: string;
  gameSlug: string;
  gameName: string;
  productName: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
};

/* ============================ SYNCED DATA ============================ */
// Saat admin update via dashboard, data di-push ke GitHub sebagai
// data/admin-data.json. Vercel redeploys → file ini terbaca saat build.
// Jika file ada & valid, override DEFAULT_GAMES. Jika tidak, fallback default.

import adminData from "../../data/admin-data.json";

type AdminDataFile = {
  games?: Game[];
  announcement?: {
    id: string;
    title: string;
    body: string;
    type: "warning" | "info" | "success";
    active: boolean;
    createdAt: number;
  } | null;
  takedown?: boolean;
  takedownReason?: string;
  settings?: { whatsappNumber: string; csName: string };
  faq?: { id: string; question: string; answer: string }[];
  waReplies?: unknown[];
  about?: AboutContent;
  reviews?: Review[];
  reports?: ContactReport[];
  version?: number;
  updatedAt?: string;
};

const parsed = adminData as AdminDataFile;

// Override games jika admin sudah sync (data lebih baru dari default)
export const SYNCED_GAMES: Game[] =
  parsed.games && parsed.games.length > 0 ? parsed.games : GAMES;

// Override announcement & takedown dari synced data
export const SYNCED_ANNOUNCEMENT = parsed.announcement ?? null;
export const SYNCED_TAKEDOWN = parsed.takedown ?? false;
export const SYNCED_TAKEDOWN_REASON =
  parsed.takedownReason ??
  "Website sedang dalam perbaikan sistem (Maintenance). Kami akan kembali secepatnya! - AKUMA JOKI";
export const SYNCED_SETTINGS = parsed.settings ?? {
  whatsappNumber: WHATSAPP_NUMBER,
  csName: "Akuma Joki",
};
export const SYNCED_FAQ = parsed.faq ?? [];
export const SYNCED_ABOUT: AboutContent = parsed.about ?? DEFAULT_ABOUT;
export const SYNCED_REVIEWS: Review[] = parsed.reviews ?? [];
export const SYNCED_REPORTS: ContactReport[] = parsed.reports ?? [];
export const SYNCED_UPDATED_AT = parsed.updatedAt ?? null;

export function getGameBySlug(slug: string | null): Game | undefined {
  if (!slug) return undefined;
  // Cari di SYNCED_GAMES dulu (data terbaru dari admin dashboard),
  // fallback ke GAMES default jika tidak ketemu.
  return SYNCED_GAMES.find((g) => g.slug === slug) ?? GAMES.find((g) => g.slug === slug);
}

export function findProduct(gameSlug: string | null, productId: string | null) {
  const game = getGameBySlug(gameSlug);
  if (!game || !productId) return { game, category: undefined, item: undefined };
  for (const cat of game.categories) {
    const item = cat.items.find((i) => i.id === productId);
    if (item) return { game, category: cat, item };
  }
  return { game, category: undefined, item: undefined };
}

/** Slugs that are valid store routes — gabungan SYNCED + default. */
export const VALID_SLUGS = Array.from(
  new Set([...SYNCED_GAMES.map((g) => g.slug), ...GAMES.map((g) => g.slug)])
);
