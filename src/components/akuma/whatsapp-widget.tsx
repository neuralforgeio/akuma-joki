"use client";

/**
 * AKUMA JOKI — Floating WhatsApp Live Chat Widget (v4)
 * --------------------------------------------------------------
 * 100% frontend-only. Pesan diteruskan via link wa.me (tab baru).
 * Tema: Retro PixelArt — font-pixel, pixel-corner, neon glow, scanlines.
 *
 * Fitur (v4):
 *  - Context-aware quick replies: di /store/[slug], menu adaptif per game.
 *  - Auto-reply engine: template menu jawab otomatis (Cek Harga, Status, Jam,
 *    Cara Order) — TIDAK redirect ke WA admin. Free-text & Chat Admin → WA admin.
 *  - Structured price-list bubble: render sebagai cards (bukan plain text) dengan
 *    deep-link button ke halaman store game terkait.
 *  - Personalized welcome: returning user (persist flag) → "Halo lagi!".
 *  - Persistence: chat history, mute, seen-flag di localStorage (cross-session).
 *  - A11y: role="log", focus trap, restore focus, aria-live.
 *  - Sound (Web Audio), operating hours, auto-open throttle, lazy-load.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, BellOff, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GAMES,
  WHATSAPP_NUMBER,
  getGameBySlug,
  type Game,
} from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";

/* ============================ KONFIGURASI ============================ */
// WHATSAPP_NUMBER di-import dari @/lib/games-data (source of truth: 6282131561301)
const CS_NAME = "Akuma Joki";
const WELCOME_MESSAGE =
  "Halo! 👋 Selamat datang di Akuma Joki. Ketik / untuk melihat menu cepat, atau ketik pesan langsung untuk chat admin via WhatsApp.";
const WELCOME_RETURNING =
  "Halo lagi! 👋 Senang melihatmu kembali. Ketik / untuk melihat menu cepat.";

type QuickReplyKind = "auto" | "redirect";
type QuickReply = {
  label: string;
  emoji: string;
  kind: QuickReplyKind;
  /** Jika "auto", reply di-generate oleh function key ini. */
  autoKey?:
    | "price-all"
    | "price-game"
    | "status"
    | "hours"
    | "cara-order"
    | "syarat"
    | "pembayaran"
    | "garansi"
    | "estimasi"
    | "custom"
    | "promo"
    | "refund"
    | "login-aman"
    | "update-progres"
    | " kontak"
    | " testimoni"
    | " tips-joki"
    | " keamanan"
    | " rate-card"
    | " bundle"
    | " cq-afk"
    | " private-server";
};

/** Menu default (di halaman non-store). */
const QUICK_REPLIES_DEFAULT: QuickReply[] = [
  { label: "Cek Harga Joki", emoji: "💰", kind: "auto", autoKey: "price-all" },
  { label: "Cara Order", emoji: "🚀", kind: "auto", autoKey: "cara-order" },
  { label: "Status Pesanan", emoji: "📦", kind: "auto", autoKey: "status" },
  { label: "Syarat & Ketentuan", emoji: "📜", kind: "auto", autoKey: "syarat" },
  { label: "Metode Pembayaran", emoji: "💳", kind: "auto", autoKey: "pembayaran" },
  { label: "Garansi Joki", emoji: "🛡️", kind: "auto", autoKey: "garansi" },
  { label: "Estimasi Waktu", emoji: "⏱️", kind: "auto", autoKey: "estimasi" },
  { label: "Jam Operasional", emoji: "🕐", kind: "auto", autoKey: "hours" },
  { label: "Promo & Diskon", emoji: "🎉", kind: "auto", autoKey: "promo" },
  { label: "Kebijakan Refund", emoji: "↩️", kind: "auto", autoKey: "refund" },
  { label: "Tips Login Aman", emoji: "🔐", kind: "auto", autoKey: "login-aman" },
  { label: "Update Progres", emoji: "📊", kind: "auto", autoKey: "update-progres" },
  { label: "Kontak & Sosmed", emoji: "📱", kind: "auto", autoKey: "kontak" },
  { label: "Testimoni", emoji: "⭐", kind: "auto", autoKey: "testimoni" },
  { label: "Tips Joki Roblox", emoji: "💡", kind: "auto", autoKey: "tips-joki" },
  { label: "Keamanan Akun", emoji: "🔒", kind: "auto", autoKey: "keamanan" },
  { label: "Rate Card Lengkap", emoji: "📋", kind: "auto", autoKey: "rate-card" },
  { label: "Paket Bundle Hemat", emoji: "📦", kind: "auto", autoKey: "bundle" },
  { label: "Cek Queue/AFK", emoji: "⏳", kind: "auto", autoKey: "cq-afk" },
  { label: "Private Server", emoji: "🎮", kind: "auto", autoKey: "private-server" },
  { label: "Chat Admin", emoji: "👤", kind: "redirect" },
];

/** Menu context-aware di halaman /store/[slug]. */
const QUICK_REPLIES_STORE: QuickReply[] = [
  { label: "Cek Harga Game Ini", emoji: "💰", kind: "auto", autoKey: "price-game" },
  { label: "Cara Order", emoji: "🚀", kind: "auto", autoKey: "cara-order" },
  { label: "Jam Operasional", emoji: "🕐", kind: "auto", autoKey: "hours" },
  { label: "Chat Admin", emoji: "👤", kind: "redirect" },
];

const REDIRECT_MSG = "Pesan dikirim! Mengarahkan ke WhatsApp admin...";
const CLIPBOARD_HINT = "Pesan disalin ke clipboard. Jika teks tidak muncul di WhatsApp, paste (Ctrl+V) ya!";
const AUTO_REPLY_HINT =
  "👆 Pilih menu di bawah untuk jawaban otomatis. Ketik pesan sendiri akan langsung diteruskan ke admin.";
const HOURS_REPLY =
  "🕐 Kami online setiap hari 13.00-21.00 WIB. Di luar jam itu, pesan akan dibalas saat kami kembali online!";
const OFFLINE_WELCOME =
  "Halo! 👋 Saat ini kami sedang OFFLINE. Tinggalkan pesan, akan kami balas saat kembali online (13.00 WIB).";
const SUBSTATUS_ONLINE = "Biasanya balas dalam beberapa menit";
const SUBSTATUS_OFFLINE = "Online 13.00-21.00 WIB";

/** Pesan auto-reply untuk "Status Pesanan" (tidak ada sistem order tracking backend). */
const STATUS_REPLY =
  "📦 Untuk cek status order, ketik Order ID kamu (8 digit, mis. AK3X9F2K).\n\nOrder ID ada di modal setelah checkout & di pesan WhatsApp yang dikirim ke admin. Ketik langsung ID-nya di chat ini untuk cek status otomatis! ⚡";

/** Pesan auto-reply untuk "Chat Admin" — tetap di chat box (instruksi), redirect terpisah. */
const CHAT_ADMIN_REPLY =
  "👤 Baik! Kami arahkan kamu ke WhatsApp admin kami untuk dibantu lebih lanjut. 👇";

/** 15 New auto-reply templates */
const PROMO_REPLY =
  "🎉 PROMO & DISKON AKUMA JOKI:\n\n- Bundle 2 joki: diskon 10%\n- Bundle 3 joki: diskon 15%\n- Member return (order ke-3+): diskon 5%\n- Promo weekend: diskon 8% (Sabtu-Minggu)\n\nPromo berlaku kelipatan. Gabung sekarang! 💰";
const REFUND_REPLY =
  "↩️ KEBIJAKAN REFUND:\n\n- Refund 100% jika joki belum dimulai\n- Refund 50% jika joki sudah berjalan < 30%\n- Tidak ada refund jika joki sudah > 50% selesai\n- Refund diproses 1x24 jam via metode pembayaran awal\n\nHubungi admin untuk klaim refund.";
const LOGIN_AMAN_REPLY =
  "🔐 TIPS LOGIN AMAN:\n\n1. Ubah password sebelum & sesudah joki\n2. Aktifkan 2-Step Verification Roblox\n3. Jangan share link login ke siapapun\n4. Logout dari device lain sebelum joki\n5. Cek riwayat login setelah joki selesai\n\nKeamanan akunmu prioritas kami! 🛡️";
const UPDATE_PROGRES_REPLY =
  "📊 UPDATE PROGRES JOKI:\n\nKami update progres via WhatsApp setiap 25% penyelesaian:\n- 25%: Notif 'Joki dimulai'\n- 50%: Screenshot progres\n- 75%: Notif 'Hampir selesai'\n- 100%: Screenshot hasil + selesai\n\nKamu juga bisa tanya progres kapan saja via 'Chat Admin'!";
const KONTAK_REPLY =
  "📱 KONTAK & SOSMED AKUMA JOKI:\n\n- WhatsApp: +62 821-3156-1301\n- Jam operasional: 13.00-21.00 WIB\n- Website: akuma-joki.vercel.app\n\nIkuti sosmed kami untuk update promo & game baru! 🚀";
const TESTIMONI_REPLY =
  "⭐ TESTIMONI PELANGGAN:\n\n'RizkyGaming' - 'Pelayanan cepat, 200 level selesai 1 hari!'\n'FrozenMaster' - 'Harga bersahabat, akun aman!' (5/5)\n'TycoonKing' - 'Profit maksimal, joki pro!' (5/5)\n\nRating rata-rata: 4.9/5 dari 200+ review. Gabung sekarang! 🏆";
const TIPS_JOKI_REPLY =
  "💡 TIPS JOKI ROBLOX:\n\n1. Pastikan akun level cukup sebelum order senjata\n2. Backup inventory penting sebelum joki\n3. Pilih joki yang sesuai kebutuhan (jangan over-order)\n4. Hubungi admin untuk konsultasi gratis\n5. Manfaatkan promo bundle untuk hemat!\n\nSemoga membantu! 🎮";
const KEAMANAN_REPLY =
  "🔒 KEAMANAN AKUN ROBLOX:\n\n- Joki AKUMA tidak pakai cheat/exploit (anti-ban)\n- Akun dijaga dari hackback & trade scam\n- Joki logout dari semua device setelah selesai\n- Garansi: jika ban saat joki (bukan kesalahan user) → refund 100%\n- Privacy: data akun TIDAK disimpan setelah joki selesai\n\nAman 100% dengan AKUMA! 🛡️";
const RATE_CARD_REPLY =
  "📋 RATE CARD LENGKAP AKUMA JOKI:\n\nBlox Fruits:\n- 100 Level: 2K | 200 Level: 4K | 300 Level: 6K\n- Raid 1-10: 10K | Raid Full Skill: 10K\n- CDK: 20K | SG: 10K | SH: 10K | GH: 15K\n\nExpedition Antarctica:\n- Muncak 1-10: 15K | Muncak 1-25: 30K | NPC All: 25K\n\nRetail Tycoon 2:\n- Benerin Toko: 2K | Main Pro: 5K\n\nHarga dalam Robux (K = ribu). Hubungi admin untuk negosiasi!";
const BUNDLE_REPLY =
  "📦 PAKET BUNDLE HEMAT:\n\nBundle Blox Fruits:\n- 200 Level + Raid Full Skill = 12K (hemat 2K!)\n- 300 Level + CDK = 23K (hemat 3K!)\n- Full Package (300 Level + CDK + SG + Raid) = 40K (hemat 6K!)\n\nBundle Expedition:\n- Muncak 1-25 + NPC All = 45K (hemat 10K!)\n\nBundle Retail Tycoon:\n- Benerin Toko + Main Pro = 6K (hemat 1K!)\n\nPesan bundle sekarang! 🎉";
const CQ_AFK_REPLY =
  "⏳ CEK QUEUE & AFK:\n\nStatus queue saat ini:\n- Pagi (09-12): Queue rendah, proses cepat\n- Siang (12-15): Queue sedang\n- Sore (15-18): Queue tinggi, mungkin agak lama\n- Malam (18-21): Queue sedang\n\nTips: Order di jam sepi (pagi) untuk proses tercepat!\n\nKami TIDAK AFK saat jam operasional (13-21 WIB). Di luar jam, pesan dibalas saat online kembali.";
const PRIVATE_SERVER_REPLY =
  "🎮 PRIVATE SERVER AKUMA:\n\nKami punya private server untuk:\n- Blox Fruits (grinding cepat, no interrupt)\n- Expedition Antarctica (exclusive run)\n- Retail Tycoon 2 (testing & optimasi)\n\nKeuntungan private server:\n- No lag, no toxic player\n- Proses joki 2x lebih cepat\n- Aman dari griefing\n\nPrivate server included GRATIS untuk order > 10K! 🎁";

/** Pesan auto-reply untuk "Cara Order" — panduan step-by-step. */
const CARA_ORDER_REPLY =
  "🚀 CARA ORDER JOKI AKUMA:\n\n1. Pilih game di menu atau halaman store\n2. Klik joki yang kamu mau (mis. '200 Level')\n3. Lanjut ke Checkout & isi data (username Roblox + kontak WA)\n4. Klik 'Pesan via WhatsApp' - pesananmu langsung ke admin\n5. Transfer DP/lunas sesuai instruksi admin\n6. Joki dikerjakan! Cek progres via 'Status Pesanan'\n\nButuh bantuan? Klik 'Chat Admin' ya! 🤝";

/** Pesan auto-reply untuk "Syarat & Ketentuan" */
const SYARAT_REPLY =
  "📜 SYARAT & KETENTUAN JOKI:\n\n- Akun Roblox harus valid & bisa login\n- Joki tidak bertanggung jawab atas ban akibat cheat pihak ketiga\n- Pembayaran DP 50% atau lunas di awal\n- Proses joki bisa dipause kapan saja dengan konfirmasi\n- Refund hanya jika joki belum dimulai\n\nDengan order, kamu setuju dengan S&K di atas. 🤝";

/** Pesan auto-reply untuk "Metode Pembayaran" */
const PEMBAYARAN_REPLY =
  "💳 METODE PEMBAYARAN:\n\n- Transfer Bank (BCA, BRI, Mandiri)\n- E-Wallet (DANA, OVO, GoPay, ShopeePay)\n- QRIS (semua bank & e-wallet)\n- Robux (untuk pembayaran in-game)\n\nDP 50% di awal, pelunasan setelah joki selesai. Konfirmasi pembayaran via WhatsApp admin ya! 💰";

/** Pesan auto-reply untuk "Garansi Joki" */
const GARANSI_REPLY =
  "🛡️ GARANSI JOKI AKUMA:\n\n- Joki dijamin aman (tanpa cheat/autoban)\n- Jika akun kena ban saat proses joki (bukan kesalahan user) → refund 100%\n- Jika item/level hilang dalam 24 jam setelah joki → dikerjakan ulang gratis\n- Garansi tidak berlaku jika user login selama proses joki\n\nKami prioritaskan keamanan akunmu! 🔒";

/** Pesan auto-reply untuk "Estimasi Waktu" */
const ESTIMASI_REPLY =
  "⏱️ ESTIMASI WAKTU JOKI:\n\n- Leveling 100 Level: 1-2 jam\n- Leveling 200 Level: 2-4 jam\n- Leveling 300 Level: 4-6 jam\n- Raid: 1-3 jam per raid\n- Senjata (CDK/SG/SH/GH): 2-8 jam (tergantung requirement)\n- Expedition: 3-8 jam\n- Retail Tycoon: 2-5 jam\n\nEstimasi bisa berubah tergantung kondisi server. Admin akan update progres via WA! 📊";

/** Jam operasional (WIB). Di luar ini = offline. */
const OPEN_HOUR = 13;
const CLOSE_HOUR = 21;
/** Detik tunggu sebelum auto-open (engagement). */
const AUTO_OPEN_DELAY = 12000;
/* ===================================================================== */

type Role = "cs" | "user";
/** Variant bubble CS untuk rendering khusus (structured content). */
type MsgVariant = "text" | "price-list" | "order-input";
type Msg = {
  id: number;
  role: Role;
  text: string;
  ts?: number;
  /** Tandai pesan user sudah diteruskan ke WhatsApp (read receipt). */
  sent?: boolean;
  /** Variant render khusus untuk bubble CS. */
  variant?: MsgVariant;
  /** Jika variant="price-list", game yang di-render (undefined = semua game). */
  priceGameSlug?: string;
  /** Badge label untuk bubble CS: "AUTO" atau "ADMIN". */
  badge?: "AUTO" | "ADMIN";
};

/* ===================== EXTERNAL STORE (localStorage) ===================== */
const CHAT_KEY = "akuma-wa-chat-v3";
const MUTE_KEY = "akuma-wa-mute-v3";
const AUTO_KEY = "akuma-wa-auto-v3";
const SEEN_KEY = "akuma-wa-seen-v3";

const SERVER_CHAT: Msg[] = [{ id: 1, role: "cs", text: WELCOME_MESSAGE }];

let cachedChat: Msg[] | null = null;
let cachedMute: boolean | null = null;
let cachedId: number = 2;

function readChat(): Msg[] {
  if (cachedChat) return cachedChat;
  if (typeof window === "undefined") return SERVER_CHAT;
  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Msg[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedChat = parsed;
        // sinkronkan id counter agar tidak collision
        cachedId = parsed.reduce((mx, m) => Math.max(mx, m.id), 1) + 1;
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  cachedChat = SERVER_CHAT;
  return cachedChat;
}

function writeChat(msgs: Msg[]) {
  cachedChat = msgs;
  cachedId = msgs.reduce((mx, m) => Math.max(mx, m.id), 1) + 1;
  try {
    window.localStorage.setItem(CHAT_KEY, JSON.stringify(msgs));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("akuma-wa-chat-change"));
}

function clearChat() {
  cachedChat = [{ id: 1, role: "cs", text: WELCOME_MESSAGE }];
  cachedId = 2;
  try {
    window.localStorage.removeItem(CHAT_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("akuma-wa-chat-change"));
}

function readMute(): boolean {
  if (cachedMute !== null) return cachedMute;
  if (typeof window === "undefined") return false;
  try {
    cachedMute = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    cachedMute = false;
  }
  return cachedMute;
}

function writeMute(v: boolean) {
  cachedMute = v;
  try {
    window.localStorage.setItem(MUTE_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("akuma-wa-mute-change"));
}

function subscribeChat(cb: () => void) {
  window.addEventListener("akuma-wa-chat-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("akuma-wa-chat-change", cb);
    window.removeEventListener("storage", cb);
  };
}
function subscribeMute(cb: () => void) {
  window.addEventListener("akuma-wa-mute-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("akuma-wa-mute-change", cb);
    window.removeEventListener("storage", cb);
  };
}
const getChatSnapshot = () => readChat();
const getMuteSnapshot = () => readMute();
const getServerChat = () => SERVER_CHAT;
const getServerMute = () => false;

/* ============================ SOUND (Web Audio) ============================ */
let audioCtx: AudioContext | null = null;
function playBlip(kind: "send" | "recv") {
  try {
    if (typeof window === "undefined") return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // send = rising blip, recv = falling blip
    const t0 = ctx.currentTime;
    osc.type = "square";
    osc.frequency.setValueAtTime(kind === "send" ? 520 : 740, t0);
    osc.frequency.exponentialRampToValueAtTime(
      kind === "send" ? 780 : 480,
      t0 + 0.09
    );
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    osc.start(t0);
    osc.stop(t0 + 0.18);
  } catch {
    /* ignore */
  }
}

/* ============================ UTIL ============================ */
function nextId(): number {
  return cachedId++;
}

/**
 * Buka WhatsApp dengan teks pesan. Strategi:
 * 1. Copy pesan ke clipboard (backup jika URL corrupt oleh proxy)
 * 2. Anchor click untuk buka wa.me (lebih reliable dari window.open)
 * 3. Fallback: window.open jika anchor gagal
 *
 * Di production (Vercel, no proxy): emoji terkirim benar via URL param.
 * Di sandbox (ada proxy): emoji di URL mungkin corrupt, user bisa paste dari clipboard.
 */
async function openWhatsApp(phone: string, text: string) {
  // 1. copy pesan ke clipboard sebagai backup
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard might be blocked, ignore */
  }

  // 2. coba anchor click (bypass beberapa proxy yang intercept window.open)
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${phone}?text=${encoded}`;
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    // 3. fallback: window.open
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function formatTime(ts?: number) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** Jam operasional berbasis WIB (UTC+7). */
function getOperatingStatus(now: number) {
  const wib = new Date(now + (7 * 60 - new Date().getTimezoneOffset()) * 60000);
  const hour = wib.getHours();
  const open = hour >= OPEN_HOUR && hour < CLOSE_HOUR;
  return open;
}

/**
 * Build Msg object untuk price-list (variant="price-list").
 * Jika `gameSlug` diisi → hanya tampilkan game itu; jika undefined → semua game.
 * Render sebagai structured bubble (cards) di Bubble component, dengan deep-link
 * ke halaman store game terkait.
 */
function buildPriceListMsg(gameSlug?: string): Msg {
  const game = gameSlug ? getGameBySlug(gameSlug) : undefined;
  const title = game
    ? `💰 Harga Joki ${game.name}`
    : "💰 Daftar Harga Joki Akuma";
  const games: Game[] = game ? [game] : GAMES;
  // text fallback (untuk accessibility + screen reader + copy)
  const lines: string[] = [title];
  for (const g of games) {
    lines.push(`${g.emoji} ${g.name}`);
    for (const cat of g.categories) {
      lines.push(`  ${cat.icon} ${cat.name}`);
      for (const item of cat.items) {
        const tagStr = item.tag ? ` [${item.tag}]` : "";
        const reqStr = item.requirement ? ` ⚠️${item.requirement}` : "";
        lines.push(`    - ${item.name} - ${item.priceLabel}${tagStr}${reqStr}`);
      }
    }
  }
  lines.push("Klik 'Lihat di Store' untuk detail & order. 🚀");
  return {
    id: 0, // akan di-assign oleh nextId() di caller
    role: "cs",
    text: lines.join("\n"),
    ts: 0,
    variant: "price-list",
    priceGameSlug: gameSlug,
    badge: "AUTO",
  };
}

/** Tandai user sudah pernah buka widget (returning user detection). */
function isReturningUser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Ganti welcome bubble (id:1) dari WELCOME_MESSAGE ke WELCOME_RETURNING jika
 * user adalah returning user. Hanya berlaku jika chat masih welcome-default
 * (belum ada percakapan). Dipanggil di mount effect.
 */
function setMessagesWelcomeToReturning() {
  if (typeof window === "undefined") return;
  const cur = readChat();
  // hanya replace jika chat hanya 1 pesan (welcome) DAN text-nya default
  if (cur.length === 1 && cur[0].id === 1 && cur[0].text === WELCOME_MESSAGE) {
    writeChat([{ ...cur[0], text: WELCOME_RETURNING }]);
  }
}

/* ============================ ICONS ============================ */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M16.04 4c-6.62 0-12 5.38-12 12 0 2.11.55 4.16 1.6 5.97L4 28l6.18-1.62A11.93 11.93 0 0 0 16.04 28c6.62 0 12-5.38 12-12s-5.38-12-12-12zm0 21.82c-1.86 0-3.68-.5-5.27-1.45l-.38-.22-3.67.96.98-3.58-.25-.37a9.8 9.8 0 0 1-1.5-5.21c0-5.43 4.42-9.85 9.86-9.85 2.63 0 5.1 1.03 6.96 2.89a9.78 9.78 0 0 1 2.89 6.97c0 5.43-4.42 9.86-9.86 9.86zm5.4-7.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}

function DoubleCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={className}
    >
      <path d="M1 13l4 4L13 6" />
      <path d="M10 17l9-11" />
    </svg>
  );
}

/* ============================ COMPONENT ============================ */
export function WhatsAppWidget() {
  const messages = useSyncExternalStore(
    subscribeChat,
    getChatSnapshot,
    getServerChat
  );
  const muted = useSyncExternalStore(
    subscribeMute,
    getMuteSnapshot,
    getServerMute
  );

  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(true);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [showHint, setShowHint] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const isOnline = getOperatingStatus(now);
  const userSent = messages.some((m) => m.role === "user");
  const unreadCount = open
    ? 0
    : messages.filter((m) => m.role === "cs" && m.id > 1).length;

  /* ---------- context-aware: deteksi halaman store ---------- */
  // /store/blox-fruits → slug "blox-fruits"; /checkout → tidak context-store
  const storeSlug = useMemo(() => {
    if (!pathname) return undefined;
    const m = pathname.match(/^\/store\/([^/]+)$/);
    return m ? m[1] : undefined;
  }, [pathname]);
  const currentGame = storeSlug ? getGameBySlug(storeSlug) : undefined;
  // Baca templates dari admin store (ter-sync dari dashboard). Fallback ke default.
  const adminWaReplies = useAdminStore((s) => s.waReplies);
  const defaultQuickReplies = currentGame ? QUICK_REPLIES_STORE : QUICK_REPLIES_DEFAULT;
  const quickReplies: QuickReply[] = adminWaReplies.length > 0
    ? adminWaReplies.map((r) => ({
        label: r.label,
        emoji: r.emoji,
        kind: r.kind,
        autoKey: r.autoKey as QuickReply["autoKey"] | undefined,
      }))
    : defaultQuickReplies;
  // Baca games dari admin store (ter-sync). Fallback ke GAMES default.
  const adminGames = useAdminStore((s) => s.games);
  const csAvatar = useAdminStore((s) => s.settings.csAvatar);
  const allGames = adminGames.length > 0 ? adminGames : GAMES;
  const totalItems = currentGame
    ? currentGame.categories.reduce((a, c) => a + c.items.length, 0)
    : allGames.reduce(
        (a, g) => a + g.categories.reduce((b, c) => b + c.items.length, 0),
        0
      );

  /* ---------- effects ---------- */
  // clock untuk update status online/offline tiap menit
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10000); // update every 10s
    return () => window.clearInterval(id);
  }, []);

  // auto-scroll ke bawah saat pesan/typing berubah
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  // Esc untuk tutup
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // focus trap + restore
  useEffect(() => {
    if (open) {
      lastFocusRef.current = document.activeElement as HTMLElement;
      const t = window.setTimeout(() => inputRef.current?.focus(), 240);
      const onTab = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const dlg = dialogRef.current;
        if (!dlg) return;
        const focusables = dlg.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      window.addEventListener("keydown", onTab);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("keydown", onTab);
      };
    }
    // restore focus ke trigger saat tutup
    lastFocusRef.current?.focus?.();
  }, [open]);

  // auto-open DISABLED — biarkan user yang buka manual (sesuai request owner)
  // kode auto-open lama di-comment untuk reference, tidak dijalankan.
  // useEffect(() => {
  //   if (typeof window === "undefined") return;
  //   if (sessionStorage.getItem(AUTO_KEY)) return;
  //   const id = window.setTimeout(() => {
  //     sessionStorage.setItem(AUTO_KEY, "1");
  //     setOpen(true);
  //     setHasNew(false);
  //   }, AUTO_OPEN_DELAY);
  //   return () => window.clearTimeout(id);
  // }, []);

  /* ---------- logic ---------- */

  /**
   * Helper: push bubble user + bubble CS auto-reply (Msg object, bisa structured)
   * setelah jeda typing. Dipakai untuk SEMUA quick-reply bertipe "auto".
   * csMsg.id & csMsg.ts akan di-assign di sini (caller pakai 0).
   */
  const pushUserAndAutoReply = useCallback(
    (userText: string, csMsg: Msg) => {
      const userMsg: Msg = {
        id: nextId(),
        role: "user",
        text: userText,
        ts: Date.now(),
        sent: true,
      };
      writeChat([...messages, userMsg]);
      if (!muted) playBlip("send");

      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        const csFinal: Msg = {
          ...csMsg,
          id: nextId(),
          ts: Date.now(),
          badge: csMsg.badge ?? "AUTO",
        };
        writeChat([...readChat(), csFinal]);
        if (!muted) playBlip("recv");
      }, 1500);
    },
    [messages, muted]
  );

  /**
   * Kirim pesan FREE-TEXT (bukan dari template).
   * - Jika text cocok pattern Order ID (AK + 6 chars) → auto-reply dengan status order
   * - Jika text mengandung keyword "status/lacak/track/order" → tanya Order ID
   * - Selain itu → redirect ke WhatsApp admin
   */
  const sendMessage = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;

      const userMsg: Msg = {
        id: nextId(),
        role: "user",
        text: t,
        ts: Date.now(),
        sent: false,
      };
      const withUser = [...messages, userMsg];
      writeChat(withUser);
      setInput("");

      // === ORDER ID DETECTION ===
      // Check if text matches order ID pattern (AK + 6 alphanumeric, uppercase)
      const orderIdMatch = t.toUpperCase().match(/\bAK[A-HJ-NP-Z2-9]{6}\b/);
      // Check if user asks about order status/progress
      const isOrderQuery = /\b(status|lacak|track|order|pesanan|progres|update)\b/i.test(t);

      if (orderIdMatch) {
        // User typed an Order ID → lookup & auto-reply with status
        const orderId = orderIdMatch[0];
        const orders = useAdminStore.getState().orders;
        // Find ALL orders with this orderId (not just first)
        const matchedOrders = orders.filter(o => o.orderId?.toUpperCase() === orderId);

        setTyping(true);
        window.setTimeout(() => {
          setTyping(false);
          let replyText = "";
          if (matchedOrders.length > 0) {
            // Build summary with ALL items
            const statuses = matchedOrders.map(o => o.status);
            const allDone = statuses.every(s => s === "done");
            const allProcessing = statuses.every(s => s === "processing");
            const anyCancelled = statuses.some(s => s === "cancelled");
            const overallStatus = allDone ? "✅ Semua Selesai" :
              anyCancelled ? "❌ Ada yang Dibatalkan" :
              allProcessing ? "🔄 Semua Sedang Diproses" : "🔄 Sebagian Diproses";

            replyText = `📦 *Order ${orderId}*\n\n*Total Item:* ${matchedOrders.length}\n*Status:* ${overallStatus}\n\n*Daftar Joki:*\n`;
            matchedOrders.forEach((o, i) => {
              const itemStatus = o.status === "done" ? "✅" : o.status === "processing" ? "🔄" : o.status === "cancelled" ? "❌" : "🆕";
              replyText += `${i + 1}. ${itemStatus} ${o.productName} (${o.gameName}) - ${o.priceLabel}\n`;
            });
            replyText += `\n${allDone ? "Semua joki sudah selesai! Terima kasih sudah percaya AKUMA JOKI 🎉" : allProcessing ? "Semua joki sedang berjalan! Mohon tunggu ya 🙏" : "Ada yang bisa kami bantu? Ketik pertanyaan kamu 😊"}`;
          } else {
            replyText = `❌ Order ID "${orderId}" tidak ditemukan.\n\nPastikan ID benar (8 digit, huruf besar). Order ID ada di modal setelah checkout & di pesan WhatsApp yang dikirim ke admin.\n\nButuh bantuan? Admin akan membalas via WhatsApp 😊`;
          }
          writeChat([
            ...readChat(),
            { id: nextId(), role: "cs", text: replyText, ts: Date.now(), badge: "AUTO" },
          ]);
          if (!muted) playBlip("recv");
        }, 1500);
        return;
      }

      if (isOrderQuery && !orderIdMatch) {
        // User asks about order but didn't provide ID → ask for Order ID with input box
        setTyping(true);
        window.setTimeout(() => {
          setTyping(false);
          writeChat([
            ...readChat(),
            {
              id: nextId(),
              role: "cs",
              text: "📦 Untuk cek status order, silakan ketik Order ID kamu (8 digit, mis. AK3X9F2K) di bawah ini:",
              ts: Date.now(),
              badge: "AUTO",
              variant: "order-input",
            },
          ]);
          if (!muted) playBlip("recv");
        }, 1500);
        return;
      }

      // === DEFAULT: redirect to WhatsApp ===
      openWhatsApp(WHATSAPP_NUMBER, t);
      setShowHint(true);
      window.setTimeout(() => setShowHint(false), 5000);

      window.setTimeout(() => {
        writeChat(
          readChat().map((m) => (m.id === userMsg.id ? { ...m, sent: true } : m))
        );
      }, 500);

      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        writeChat([
          ...readChat(),
          {
            id: nextId(),
            role: "cs",
            text: REDIRECT_MSG,
            ts: Date.now(),
            badge: "ADMIN",
          },
        ]);
        if (!muted) playBlip("recv");
      }, 1500);

      if (!muted) playBlip("send");
    },
    [messages, muted]
  );

  /**
   * Handle quick-reply:
   *  - kind "auto"     → jawab otomatis di chat box (TIDAK redirect ke WA admin).
   *  - kind "redirect" → tampilkan instruksi di chat box + redirect ke WA admin.
   *
   * autoKey dispatcher: price-all / price-game / status / hours / cara-order.
   */
  const handleQuickReply = useCallback(
    (q: QuickReply) => {
      // === AUTO-REPLY (tidak redirect ke WA admin) ===
      if (q.kind === "auto" && q.autoKey) {
        let csMsg: Msg | null = null;
        switch (q.autoKey) {
          case "price-all":
            csMsg = buildPriceListMsg();
            break;
          case "price-game":
            csMsg = buildPriceListMsg(storeSlug);
            break;
          case "status":
            csMsg = {
              id: 0,
              role: "cs",
              text: "📦 Untuk cek status order, silakan masukkan Order ID kamu di kotak di bawah ini:",
              ts: 0,
              badge: "AUTO",
              variant: "order-input",
            };
            break;
          case "hours":
            csMsg = { id: 0, role: "cs", text: HOURS_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "cara-order":
            csMsg = {
              id: 0,
              role: "cs",
              text: CARA_ORDER_REPLY,
              ts: 0,
              badge: "AUTO",
            };
            break;
          case "syarat":
            csMsg = { id: 0, role: "cs", text: SYARAT_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "pembayaran":
            csMsg = { id: 0, role: "cs", text: PEMBAYARAN_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "garansi":
            csMsg = { id: 0, role: "cs", text: GARANSI_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "estimasi":
            csMsg = { id: 0, role: "cs", text: ESTIMASI_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "promo":
            csMsg = { id: 0, role: "cs", text: PROMO_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "refund":
            csMsg = { id: 0, role: "cs", text: REFUND_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "login-aman":
            csMsg = { id: 0, role: "cs", text: LOGIN_AMAN_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "update-progres":
            csMsg = {
              id: 0,
              role: "cs",
              text: "📊 Untuk cek progres joki, silakan masukkan Order ID kamu di kotak di bawah ini:",
              ts: 0,
              badge: "AUTO",
              variant: "order-input",
            };
            break;
          case "kontak":
            csMsg = { id: 0, role: "cs", text: KONTAK_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "testimoni":
            csMsg = { id: 0, role: "cs", text: TESTIMONI_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "tips-joki":
            csMsg = { id: 0, role: "cs", text: TIPS_JOKI_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "keamanan":
            csMsg = { id: 0, role: "cs", text: KEAMANAN_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "rate-card":
            csMsg = { id: 0, role: "cs", text: RATE_CARD_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "bundle":
            csMsg = { id: 0, role: "cs", text: BUNDLE_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "cq-afk":
            csMsg = { id: 0, role: "cs", text: CQ_AFK_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "private-server":
            csMsg = { id: 0, role: "cs", text: PRIVATE_SERVER_REPLY, ts: 0, badge: "AUTO" };
            break;
          case "custom":
            // Template custom dari admin dashboard — reply diambil dari waReplies store
            {
              const customReply = useAdminStore.getState().waReplies.find(
                (r) => r.label === q.label
              );
              if (customReply?.reply) {
                csMsg = { id: 0, role: "cs", text: customReply.reply, ts: 0, badge: "AUTO" };
              }
            }
            break;
        }
        if (csMsg) {
          pushUserAndAutoReply(`${q.emoji} ${q.label}`, csMsg);
          return;
        }
      }

      // === REDIRECT ke WhatsApp admin ===
      // (Chat Admin, atau fallback): tampilkan instruksi dulu, lalu buka wa.me
      const userMsg: Msg = {
        id: nextId(),
        role: "user",
        text: `${q.emoji} ${q.label}`,
        ts: Date.now(),
        sent: false,
      };
      writeChat([...messages, userMsg]);
      if (!muted) playBlip("send");

      // redirect ke WA admin dengan teks bawaan (anchor click untuk emoji-safe)
      const waText = `Halo Admin Akuma Joki, saya mau bertanya/${q.label}`;
      openWhatsApp(WHATSAPP_NUMBER, waText);

      // tandai user message sent
      window.setTimeout(() => {
        writeChat(
          readChat().map((m) => (m.id === userMsg.id ? { ...m, sent: true } : m))
        );
      }, 500);

      // CS reply instruksi + konfirmasi redirect (badge ADMIN)
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        writeChat([
          ...readChat(),
          {
            id: nextId(),
            role: "cs",
            text: CHAT_ADMIN_REPLY,
            ts: Date.now(),
            badge: "ADMIN",
          },
          {
            id: nextId(),
            role: "cs",
            text: REDIRECT_MSG,
            ts: Date.now(),
            badge: "ADMIN",
          },
        ]);
        if (!muted) playBlip("recv");
      }, 1500);
    },
    [messages, muted, pushUserAndAutoReply, storeSlug]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggle = () => {
    setOpen((o) => !o);
    setHasNew(false);
    markSeen();
  };

  const toggleMute = () => writeMute(!muted);
  const handleClear = () => {
    clearChat();
    setTyping(false);
  };

  const charCount = input.length;
  const nearLimit = charCount > 400;

  /* ---------- emoji picker ---------- */
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const EMOJI_SETS = [
    // Ekspresi
    ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😎", "🤔", "😴", "🤯", "🥳", "😭"],
    // Jempol & gestur
    ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤙", "👋", "🙏", "💪", "🔥", "✨", "💯", "❤️", "🧡", "💚", "💙", "💜", "🖤", "🤍"],
    // Game & simbol
    ["🎮", "🕹️", "⚔️", "🛡️", "🗡️", "🏹", "💎", "💰", "🏆", "🥇", "🚀", "⭐", "🌟", "🎯", "🎲", "🃏", "👑", "💀", "👻", "🤖"],
    // Aktivitas & objek
    ["📦", "🛒", "💳", "💸", "🎁", "🕐", "📅", "⚡", "🔔", "📌", "✅", "❌", "⚠️", "❓", "❗", "💬", "📧", "📱", "💻", "🌐"],
  ] as const;
  const [emojiTab, setEmojiTab] = useState(0);
  const insertEmoji = (em: string) => {
    setInput((v) => v + em);
    inputRef.current?.focus();
  };

  /* ---------- command picker (/ template) ---------- */
  // Ketik "/" di input → munculkan picker template chat (quick replies) lagi,
  // bahkan setelah user pernah kirim pesan. Filter by text setelah "/".
  const trimmedInput = input.trim();
  const showCommandPicker = trimmedInput.startsWith("/");
  const commandQuery = trimmedInput.slice(1).toLowerCase();
  const filteredCommands = showCommandPicker
    ? quickReplies.filter((q) =>
        q.label.toLowerCase().includes(commandQuery)
      )
    : [];

  const handleCommandPick = (q: QuickReply) => {
    setInput("");
    handleQuickReply(q);
  };

  // personalized welcome: jika returning user & chat masih welcome-default,
  // ganti welcome bubble (id:1) ke welcome-returning. Jalankan sekali di mount.
  useEffect(() => {
    if (!isReturningUser()) return;
    setMessagesWelcomeToReturning();
  }, []);

  /* ============================ RENDER ============================ */
  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] print:hidden"
      aria-live="polite"
    >
      {/* ===== Clipboard Hint Toast ===== */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 w-[min(20rem,calc(100vw-2rem))] bg-[#0a0a0a] border-2 border-[#ffd166]/60 pixel-corner p-3 shadow-[0_0_0_2px_#0a0a0a,0_0_16px_rgba(255,209,102,0.4)]"
            role="status"
          >
            <p className="font-pixel text-[7px] uppercase tracking-wide text-[#ffd166] leading-relaxed">
              {CLIPBOARD_HINT}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Popup Chat Box ===== */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="wa-chat"
            ref={dialogRef}
            role="dialog"
            aria-label={`Live chat ${CS_NAME}`}
            aria-modal="false"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
            className={cn(
              "relative mb-4 flex flex-col overflow-hidden",
              "w-[min(22rem,calc(100vw-2rem))]",
              "h-[32rem] max-h-[calc(100vh-7rem)]",
              "bg-[#121017] text-[#e5e5e5]",
              "border-2 border-[#25D366] pixel-corner scanlines",
              "shadow-[0_0_0_2px_#0a0a0a,0_0_0_4px_#25D366,0_0_28px_rgba(37,211,102,0.45),0_18px_40px_-12px_rgba(0,0,0,0.8)]"
            )}
          >
            {/* ===== Header ===== */}
            <div className="relative flex items-center gap-3 border-b-2 border-[#25D366]/40 bg-[#0a0a0a] px-3 py-3">
              <div className="relative shrink-0">
                <div
                  className={cn(
                    "absolute inset-0 rounded-full blur-md",
                    isOnline ? "bg-[#25D366]/40" : "bg-[#9a93a8]/30"
                  )}
                />
                <div
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-full font-pixel text-[11px] text-[#0a0a0a] overflow-hidden",
                    isOnline ? "bg-[#25D366]" : "bg-[#6b6478]"
                  )}
                  style={{
                    boxShadow: isOnline
                      ? "0 0 0 2px #0a0a0a, 0 0 0 4px #25D366, 0 0 12px rgba(37,211,102,0.7)"
                      : "0 0 0 2px #0a0a0a, 0 0 0 4px #6b6478",
                  }}
                  aria-hidden="true"
                >
                  {csAvatar ? (
                    <img src={csAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "AJ"
                  )}
                </div>
                {/* status dot */}
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0a]",
                    isOnline ? "bg-[#6ee7b7]" : "bg-[#9a93a8]"
                  )}
                  style={{
                    boxShadow: isOnline
                      ? "0 0 8px rgba(110,231,183,0.9)"
                      : "0 0 6px rgba(154,147,168,0.6)",
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-pixel text-[11px] uppercase tracking-wide text-[#e5e5e5] truncate">
                    {CS_NAME}
                  </p>
                  <span className="rounded-sm bg-[#25D366]/15 px-1.5 py-0.5 font-pixel text-[7px] uppercase tracking-wide text-[#25D366]">
                    CS
                  </span>
                  {currentGame && (
                    <span
                      className="rounded-sm px-1.5 py-0.5 font-pixel text-[7px] uppercase tracking-wide"
                      style={{
                        background: `${currentGame.accent}22`,
                        color: currentGame.accent,
                        border: `1px solid ${currentGame.accent}66`,
                      }}
                      title={`Kamu di store ${currentGame.name}`}
                    >
                      {currentGame.emoji} {currentGame.name}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  {isOnline ? (
                    <>
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#6ee7b7]" />
                      <AnimatePresence mode="wait" initial={false}>
                        {typing ? (
                          <motion.p
                            key="typing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-violet-400"
                          >
                            Mengetik...
                          </motion.p>
                        ) : (
                          <motion.p
                            key="online"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-pixel text-[7px] uppercase tracking-wide text-[#6ee7b7]"
                          >
                            Online · {SUBSTATUS_ONLINE}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#9a93a8]" />
                      <p className="font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">
                        Offline · {SUBSTATUS_OFFLINE}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* mute toggle */}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Aktifkan suara notifikasi" : "Matikan suara notifikasi"}
                aria-pressed={muted}
                title={muted ? "Bunyikan suara" : "Bisukan suara"}
                className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner transition-colors hover:border-[#25D366] hover:text-[#25D366]"
              >
                {muted ? <BellOff className="size-4" /> : <Bell className="size-4" />}
              </button>
              {/* clear chat */}
              <button
                type="button"
                onClick={handleClear}
                aria-label="Hapus percakapan"
                title="Hapus percakapan"
                className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner transition-colors hover:border-[#ff3b6b] hover:text-[#ff3b6b]"
              >
                <Trash2 className="size-4" />
              </button>
              {/* close */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup chat"
                className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner transition-colors hover:border-[#e5e5e5] hover:text-[#e5e5e5]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* ===== Body ===== */}
            <div
              ref={bodyRef}
              role="log"
              aria-label="Riwayat percakapan"
              aria-live="polite"
              className="relative flex-1 space-y-3 overflow-y-auto bg-[#0a0a0a] px-3 py-4"
            >
              {/* animated grid bg */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(37,211,102,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,211,102,0.07) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                  animation: "wa-grid-move 18s linear infinite",
                }}
                aria-hidden="true"
              />

              {/* tanggal chip */}
              <div className="relative flex justify-center">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-zinc-500">
                  Hari ini
                </span>
              </div>

              {/* Hint "/" — muncul saat belum ada pesan user */}
              {!userSent && !typing && (
                <div className="relative flex justify-center mt-3 mb-1">
                  <div className="glass rounded-2xl px-4 py-3 text-center max-w-[85%]">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      💡 Ketik <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-violet-500/20 border border-violet-500/30 text-violet-400 font-mono text-[10px] font-bold">/</span> di kolom pesan untuk melihat menu cepat
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {quickReplies.length} template tersedia · atau ketik pesan langsung ke admin
                    </p>
                  </div>
                </div>
              )}

              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const showDateDivider =
                  i > 0 &&
                  m.ts &&
                  prev?.ts &&
                  new Date(m.ts).toDateString() !==
                    new Date(prev.ts).toDateString();
                return (
                  <div key={m.id} className="relative">
                    {showDateDivider && (
                      <div className="my-2 flex justify-center">
                        <span className="rounded-sm border border-[#2a2436] bg-[#121017] px-2 py-1 font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">
                          {new Date(m.ts!).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                    )}
                    <Bubble msg={m} isOnline={isOnline} />
                  </div>
                );
              })}

              {/* typing indicator — dengan teks "Mengetik..." */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex items-end gap-2"
                  >
                    <AvatarMini online={isOnline} avatar={csAvatar} />
                    <div className="flex flex-col gap-1">
                      <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-violet-400" style={{ animation: "wa-typing 1s 0ms ease-in-out infinite" }} />
                        <span className="inline-block h-2 w-2 rounded-full bg-violet-400" style={{ animation: "wa-typing 1s 150ms ease-in-out infinite" }} />
                        <span className="inline-block h-2 w-2 rounded-full bg-violet-400" style={{ animation: "wa-typing 1s 300ms ease-in-out infinite" }} />
                      </div>
                      <span className="text-[10px] text-zinc-500 ml-1">Mengetik...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== Quick Replies DIHAPUS — ganti dengan hint "/" di chat body ===== */}
            {/* User lihat hint "/" di chat body, ketik / untuk munculkan picker */}

            {/* ===== Input Area ===== */}
            <form
              onSubmit={handleSubmit}
              className="relative border-t-2 border-[#25D366]/40 bg-[#121017] px-2.5 py-2.5"
            >
              {/* ===== Command Picker (ketik "/" untuk template) ===== */}
              <AnimatePresence>
                {showCommandPicker && !showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute bottom-full left-0 right-0 mb-2 max-h-56 overflow-y-auto bg-[#0a0a0a] border-2 border-[#25D366]/60 pixel-corner shadow-[0_0_0_2px_#0a0a0a,0_0_18px_rgba(37,211,102,0.35)]"
                    role="listbox"
                    aria-label="Pilih template chat"
                  >
                    {/* header picker */}
                    <div className="sticky top-0 flex items-center justify-between gap-2 border-b-2 border-[#25D366]/30 bg-[#0a0a0a] px-3 py-2">
                      <span className="font-pixel text-[7px] uppercase tracking-wide text-[#6ee7b7]">
                        ⌘ Template Chat
                      </span>
                      <span className="font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8]">
                        {filteredCommands.length} menu
                      </span>
                    </div>
                    {filteredCommands.length === 0 ? (
                      <p className="px-3 py-4 text-center font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">
                        Tidak ada template cocok
                      </p>
                    ) : (
                      <div className="p-1.5">
                        {filteredCommands.map((q) => (
                          <button
                            key={q.label}
                            type="button"
                            onClick={() => handleCommandPick(q)}
                            className="group flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-[#25D366]/10 pixel-corner"
                            role="option"
                            aria-selected="false"
                          >
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center border-2 pixel-corner text-xs",
                                q.kind === "auto"
                                  ? "border-[#25D366]/60 text-[#25D366]"
                                  : "border-[#a020f0]/60 text-[#c44bff]"
                              )}
                              aria-hidden="true"
                            >
                              {q.emoji}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-pixel text-[8px] uppercase tracking-wide text-[#e5e5e5] truncate group-hover:text-[#6ee7b7]">
                                {q.label}
                              </span>
                              <span className="block font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8]">
                                {q.kind === "auto" ? "⚡ Auto-reply" : "📱 Ke admin"}
                              </span>
                            </span>
                            <span
                              className="font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8] group-hover:text-[#25D366] shrink-0"
                              aria-hidden="true"
                            >
                              ↵
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* panduan footer picker */}
                    <div className="border-t-2 border-[#25D366]/20 bg-[#121017] px-3 py-1.5">
                      <p className="font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8] leading-relaxed">
                        Ketik "/" + kata kunci untuk filter. Klik menu = jalankan.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ===== Emoji Picker ===== */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-[#0a0a0a] border-2 border-[#25D366]/60 pixel-corner shadow-[0_0_0_2px_#0a0a0a,0_0_18px_rgba(37,211,102,0.35)]"
                    role="dialog"
                    aria-label="Pilih emoji"
                  >
                    {/* tabs */}
                    <div className="flex border-b-2 border-[#25D366]/20 bg-[#121017]">
                      {["😀", "👍", "🎮", "📦"].map((icon, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEmojiTab(i)}
                          aria-label={`Emoji kategori ${i + 1}`}
                          aria-pressed={emojiTab === i}
                          className={cn(
                            "flex-1 py-2 text-lg transition-colors",
                            emojiTab === i
                              ? "bg-[#25D366]/15 border-b-2 border-[#25D366]"
                              : "hover:bg-[#25D366]/5 border-b-2 border-transparent"
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    {/* emoji grid */}
                    <div className="grid grid-cols-8 gap-0.5 p-2 max-h-40 overflow-y-auto">
                      {EMOJI_SETS[emojiTab].map((em, idx) => (
                        <button
                          key={`${emojiTab}-${idx}`}
                          type="button"
                          onClick={() => insertEmoji(em)}
                          className="flex h-7 w-7 items-center justify-center text-base hover:bg-[#25D366]/15 rounded-sm transition-colors"
                          aria-label={`Insert emoji ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                    <div className="border-t-2 border-[#25D366]/20 bg-[#121017] px-3 py-1.5">
                      <p className="font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8]">
                        Klik emoji untuk sisipkan ke pesan
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                {/* emoji toggle button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker((v) => !v);
                    // hide command picker by clearing "/" prefix
                    if (input.trim().startsWith("/")) setInput("");
                  }}
                  aria-label={showEmojiPicker ? "Tutup emoji picker" : "Buka emoji picker"}
                  aria-pressed={showEmojiPicker}
                  title="Emoji"
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center border-2 pixel-corner transition-all text-lg active:translate-y-[1px]",
                    showEmojiPicker
                      ? "bg-[#25D366] text-[#0a0a0a] border-[#25D366] shadow-[0_0_12px_rgba(37,211,102,0.6)]"
                      : "bg-[#0a0a0a] text-[#e5e5e5] border-[#2a2436] hover:border-[#25D366] hover:text-[#25D366]"
                  )}
                >
                  😀
                </button>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (showEmojiPicker) setShowEmojiPicker(false);
                  }}
                  onFocus={() => showEmojiPicker && setShowEmojiPicker(false)}
                  placeholder="Ketik pesan → WA admin · ketik / untuk template"
                  aria-label="Ketik pesan untuk diteruskan ke admin WhatsApp, ketik / untuk template, atau klik emoji"
                  maxLength={500}
                  className={cn(
                    "min-w-0 flex-1 bg-[#0a0a0a] px-3 py-2.5 font-sans text-sm text-[#e5e5e5] placeholder:text-[#9a93a8] border-2 pixel-corner outline-none transition-colors",
                    showCommandPicker
                      ? "border-[#25D366] shadow-[0_0_12px_rgba(37,211,102,0.5)]"
                      : "border-[#2a2436] focus:border-[#25D366] focus:shadow-[0_0_10px_rgba(37,211,102,0.4)]"
                  )}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || showCommandPicker}
                  aria-label="Kirim pesan"
                  className="btn-shine flex h-11 w-11 shrink-0 items-center justify-center bg-[#25D366] text-[#0a0a0a] border-2 border-[#25D366] pixel-corner transition-all hover:bg-[#1ebe5d] hover:shadow-[0_0_14px_rgba(37,211,102,0.7)] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <Send className="size-4" />
                </button>
              </div>
              {/* char counter + footer notice + command hint */}
              <div className="mt-1.5 flex items-center justify-between px-1">
                <p className="font-pixel text-[6px] uppercase tracking-wide text-[#c44bff]">
                  ✦ Pesan ini → WA Admin
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[6px] uppercase tracking-wide text-[#25D366]/80">
                    😀 = emoji · / = template
                  </span>
                  <p
                    className={cn(
                      "font-pixel text-[6px] uppercase tracking-wide transition-colors",
                      nearLimit ? "text-[#ff3b6b]" : "text-[#9a93a8]/60"
                    )}
                  >
                    {charCount}/500
                  </p>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Floating Button ===== */}
      <div className="flex justify-end">
        <motion.button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-label={open ? "Tutup live chat WhatsApp" : "Buka live chat WhatsApp"}
          aria-expanded={open}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#0a0a0a] sm:h-16 sm:w-16"
          style={{
            boxShadow:
              "0 0 0 3px #0a0a0a, 0 0 0 6px #25D366, 0 0 22px rgba(37,211,102,0.7), 0 8px 20px -6px rgba(0,0,0,0.7)",
          }}
          animate={{ scale: open ? 0.9 : 1 }}
          whileHover={{ scale: open ? 0.9 : 1.06 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          {/* pulse ring */}
          {!open && (
            <>
              <span
                className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#25D366]"
                style={{ animation: "wa-ping 2.2s cubic-bezier(0,0,0.2,1) infinite" }}
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#25D366]"
                style={{ animation: "wa-ping 2.2s cubic-bezier(0,0,0.2,1) infinite 1.1s" }}
                aria-hidden="true"
              />
            </>
          )}

          {/* badge notif unread */}
          {!open && unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-[#ff3b6b] px-1 font-pixel text-[8px] text-white"
              style={{ boxShadow: "0 0 10px rgba(255,59,107,0.9)" }}
              aria-hidden="true"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
          {/* initial badge (sebelum ada pesan CS baru) */}
          {!open && unreadCount === 0 && hasNew && (
            <span
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-[#ff3b6b] px-1 font-pixel text-[8px] text-white"
              style={{ boxShadow: "0 0 10px rgba(255,59,107,0.9)" }}
              aria-hidden="true"
            >
              1
            </span>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <X className="size-6" />
              </motion.span>
            ) : (
              <motion.span
                key="wa"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <WhatsAppIcon className="size-7 sm:size-8" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* keyframes injected locally */}
      <style>{`
        @keyframes wa-ping {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.7); opacity: 0;   }
          100% { transform: scale(1.7); opacity: 0;   }
        }
        @keyframes wa-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%           { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes wa-grid-move {
          from { background-position: 0 0, 0 0; }
          to   { background-position: 24px 24px, 24px 24px; }
        }
      `}</style>
    </div>
  );
}

/* ============================ Sub-components ============================ */

/** TypingText — animasi reveal text huruf demi huruf (typing effect)
 *  Hanya animate untuk pesan BARU (id > lastSeenId).
 *  Pesan lama (saat widget dibuka kembali) langsung show tanpa animasi.
 */
function TypingText({ text, msgId }: { text: string; msgId: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Cek apakah pesan ini sudah pernah dilihat (ada di sessionStorage)
    const seenKey = `akuma-wa-seen-${msgId}`;
    const wasSeen = sessionStorage.getItem(seenKey) === "1";

    // Skip animation untuk text panjang atau yang sudah dilihat
    if (wasSeen || text.length > 300) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    // Tandai sebagai sudah dilihat
    sessionStorage.setItem(seenKey, "1");

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text, msgId]);

  return (
    <span className={cn(!done && "after:content-['▋'] after:text-violet-400 after:animate-pulse")}>
      {displayed}
    </span>
  );
}

/** OrderInputContent — input box untuk user masukkan Order ID, lalu auto-reply status */
function OrderInputContent({ msgId }: { msgId: number }) {
  const [orderId, setOrderId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = () => {
    const id = orderId.trim().toUpperCase();
    if (id.length < 8) return;

    setSubmitted(true);
    const orders = useAdminStore.getState().orders;
    // Find ALL orders with this orderId
    const matchedOrders = orders.filter(o => o.orderId?.toUpperCase() === id);

    if (matchedOrders.length > 0) {
      const statuses = matchedOrders.map(o => o.status);
      const allDone = statuses.every(s => s === "done");
      const allProcessing = statuses.every(s => s === "processing");
      const anyCancelled = statuses.some(s => s === "cancelled");
      const overallStatus = allDone ? "✅ Semua Selesai" :
        anyCancelled ? "❌ Ada yang Dibatalkan" :
        allProcessing ? "🔄 Semua Sedang Diproses" : "🔄 Sebagian Diproses";

      let result = `📦 Order ${id}\n\nTotal Item: ${matchedOrders.length}\nStatus: ${overallStatus}\n\nDaftar Joki:\n`;
      matchedOrders.forEach((o, i) => {
        const itemStatus = o.status === "done" ? "✅" : o.status === "processing" ? "🔄" : o.status === "cancelled" ? "❌" : "🆕";
        result += `${i + 1}. ${itemStatus} ${o.productName} (${o.gameName}) - ${o.priceLabel}\n`;
      });
      result += `\n${allDone ? "Semua joki sudah selesai! 🎉" : allProcessing ? "Joki sedang berjalan! Mohon tunggu ya 🙏" : "Ada yang bisa kami bantu?"}`;
      setResult(result);
    } else {
      setResult(`❌ Order ID "${id}" tidak ditemukan.\n\nPastikan ID benar (8 digit). Cek di modal setelah checkout atau di pesan WhatsApp admin.`);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-[#e5e5e5]">📦 Ketik Order ID kamu (8 digit):</p>
      {!submitted ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="AK3X9F2K"
            maxLength={8}
            className="flex-1 bg-[#0a0a0a] border-2 border-[#a020f0]/40 text-[#e5e5e5] px-2 py-1.5 text-sm font-mono uppercase tracking-wider outline-none focus:border-[#a020f0] pixel-corner"
          />
          <button
            onClick={handleSubmit}
            disabled={orderId.length < 8}
            className="bg-[#a020f0] text-white px-3 py-1.5 text-xs font-pixel uppercase pixel-corner hover:bg-[#c44bff] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Cek
          </button>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#2a2436] rounded-md p-2.5">
          <p className="text-[10px] text-[#9a93a8] mb-1">Order ID: {orderId}</p>
          <p className="text-sm text-[#e5e5e5] whitespace-pre-line">{result}</p>
        </div>
      )}
    </div>
  );
}

function Bubble({ msg, isOnline }: { msg: Msg; isOnline: boolean }) {
  const isUser = msg.role === "user";
  const isRedirect = msg.role === "cs" && msg.text === REDIRECT_MSG;
  const isHours = msg.role === "cs" && msg.text === HOURS_REPLY;
  const isPriceList = msg.variant === "price-list";
  const isOrderInput = msg.variant === "order-input";
  // Baca csAvatar langsung dari store (Bubble adalah sub-component, tidak punya akses ke scope parent)
  const csAvatar = useAdminStore((s) => s.settings.csAvatar);
  const isCaraOrder = msg.role === "cs" && msg.text === CARA_ORDER_REPLY;
  // games untuk price-list: jika priceGameSlug diisi → 1 game, else semua
  const priceGames: Game[] = isPriceList
    ? msg.priceGameSlug
      ? [getGameBySlug(msg.priceGameSlug)].filter(Boolean) as Game[]
      : GAMES
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        isRedirect
          ? { type: "spring", stiffness: 500, damping: 14, mass: 0.6 }
          : { duration: 0.2, ease: "easeOut" }
      }
      className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && <AvatarMini online={isOnline} avatar={csAvatar} />}
      <div className={cn("max-w-[88%]", isUser && "order-1")}>
        {/* badge AUTO/ADMIN di atas bubble CS */}
        {!isUser && msg.badge && (
          <div className="mb-1 flex items-center gap-1">
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 font-pixel text-[6px] uppercase tracking-wide pixel-corner",
                msg.badge === "AUTO"
                  ? "bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/40"
                  : "bg-[#a020f0]/15 text-[#c44bff] border border-[#a020f0]/40"
              )}
            >
              {msg.badge === "AUTO" ? "⚡ Auto" : "📱 Admin"}
            </span>
          </div>
        )}
        <div
          className={cn(
            "px-3 py-2 font-sans text-sm leading-relaxed",
            isUser
              ? "rounded-md rounded-br-none border-2 border-[#0a0a0a] bg-[#25D366] text-[#0a0a0a]"
              : isHours
                ? "rounded-md rounded-bl-none border-2 border-[#a020f0]/60 bg-[#1a1722] text-[#e5e5e5]"
                : isCaraOrder
                  ? "rounded-md rounded-bl-none border-2 border-[#ffd166]/50 bg-[#1a1722] text-[#e5e5e5] whitespace-pre-line"
                  : "rounded-md rounded-bl-none border-2 border-[#2a2436] bg-[#1a1722] text-[#e5e5e5]"
          )}
        >
          {isPriceList ? (
            <PriceListContent games={priceGames} single={!!msg.priceGameSlug} />
          ) : isOrderInput ? (
            <OrderInputContent msgId={msg.id} />
          ) : isCaraOrder ? (
            <span className="whitespace-pre-line">{msg.text}</span>
          ) : isUser ? (
            <span className="whitespace-pre-line">{msg.text}</span>
          ) : (
            <span className="whitespace-pre-line"><TypingText text={msg.text} msgId={msg.id} /></span>
          )}
        </div>
        <div
          className={cn(
            "mt-1 flex items-center gap-1.5",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <p
            className={cn(
              "font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]",
              isUser ? "text-right" : "text-left"
            )}
          >
            {msg.ts ? formatTime(msg.ts) : ""}
          </p>
          {isUser && msg.sent && (
            <DoubleCheck className="size-3 text-[#25D366]" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Render structured price-list content (cards per game) dengan deep-link
 * ke halaman store game terkait.
 */
function PriceListContent({
  games,
  single,
}: {
  games: Game[];
  single: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <p className="font-pixel text-[9px] uppercase tracking-wide text-[#25D366]">
        {single ? "💰 Harga Game Ini" : "💰 Semua Game"}
      </p>
      {games.map((g) => (
        <div
          key={g.slug}
          className="border border-[#2a2436] bg-[#0a0a0a]/60 pixel-corner p-2"
        >
          {/* game header + deep-link */}
          <Link
            href={`/store/${g.slug}`}
            className="flex items-center justify-between gap-2 group"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span aria-hidden="true">{g.emoji}</span>
              <span
                className="font-pixel text-[8px] uppercase tracking-wide truncate"
                style={{ color: g.accent }}
              >
                {g.name}
              </span>
            </span>
            <span
              className="flex items-center gap-0.5 font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8] group-hover:text-[#25D366] transition-colors shrink-0"
            >
              Store <ArrowRight className="size-2.5" />
            </span>
          </Link>
          {/* categories + items */}
          <div className="mt-1.5 space-y-1.5">
            {g.categories.map((cat) => (
              <div key={cat.id}>
                <p className="font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8]">
                  {cat.icon} {cat.name}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {cat.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-[11px] leading-tight"
                    >
                      <span className="flex items-center gap-1 min-w-0">
                        <span className="text-[#9a93a8]">•</span>
                        <span className="text-[#e5e5e5] truncate">{item.name}</span>
                        {item.tag && (
                          <span className="font-pixel text-[5px] uppercase tracking-wide px-1 py-0.5 rounded-sm shrink-0" style={{ background: `${g.accent}22`, color: g.accent }}>
                            {item.tag}
                          </span>
                        )}
                      </span>
                      <span className="font-pixel text-[8px] text-[#c44bff] shrink-0">
                        {item.priceLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8] pt-1">
        Klik nama game → lihat detail & order 🚀
      </p>
    </div>
  );
}

function AvatarMini({ online, avatar }: { online: boolean; avatar?: string }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-pixel text-[8px] text-[#0a0a0a] overflow-hidden",
        online ? "bg-[#25D366]" : "bg-[#6b6478]"
      )}
      style={{
        boxShadow: online
          ? "0 0 0 1px #0a0a0a, 0 0 6px rgba(37,211,102,0.5)"
          : "0 0 0 1px #0a0a0a",
      }}
      aria-hidden="true"
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        "AJ"
      )}
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-[#9a93a8]"
      style={{ animation: `wa-typing 1s ${delay} ease-in-out infinite` }}
      aria-hidden="true"
    />
  );
}
