"use client";

/**
 * AKUMA JOKI — Floating WhatsApp Live Chat Widget (v2)
 * --------------------------------------------------------------
 * 100% frontend-only. Pesan diteruskan via link wa.me (tab baru).
 * Tema: Retro PixelArt — font-pixel, pixel-corner, neon glow, scanlines.
 *
 * Fitur (v2):
 *  - Floating button bulat hijau WhatsApp + pulse ring + badge notif unread.
 *  - Popup chat box (slide-up + fade-in, Framer Motion spring).
 *  - Header: avatar "AJ", nama CS, status Online/Offline (jam operasional),
 *    tombol mute sound + tombol clear chat.
 *  - Body: welcome bubble + quick reply chips (dengan emoji) + typing indicator.
 *  - Input: text input + char counter + tombol kirim (paper plane).
 *  - Sound "blip" saat kirim/terima (Web Audio API, gated by mute).
 *  - Persistence: riwayat chat & mute disimpan ke localStorage (cross-session).
 *  - Auto-open: setelah 12s jika user belum interaksi (throttle via sessionStorage).
 *  - A11y: role="log", focus trap saat popup terbuka, restore focus saat tutup.
 *  - Kirim -> push bubble user -> window.open(wa.me) -> typing -> bubble CS konfirmasi.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GAMES, WHATSAPP_NUMBER } from "@/lib/games-data";

/* ============================ KONFIGURASI ============================ */
// WHATSAPP_NUMBER di-import dari @/lib/games-data (source of truth: 6282131561301)
const CS_NAME = "Akuma Joki";
const WELCOME_MESSAGE =
  "Halo! 👋 Selamat datang di Akuma Joki. Pilih menu cepat di bawah untuk jawaban otomatis, atau ketik pesanmu untuk langsung chat admin via WhatsApp. 🚀";

const QUICK_REPLIES: { label: string; emoji: string; kind: "auto" | "redirect" }[] = [
  { label: "Cek Harga Joki", emoji: "💰", kind: "auto" },
  { label: "Status Pesanan", emoji: "📦", kind: "auto" },
  { label: "Jam Operasional", emoji: "🕐", kind: "auto" },
  { label: "Chat Admin", emoji: "👤", kind: "redirect" },
];
const REDIRECT_MSG = "Pesan dikirim! Mengarahkan ke WhatsApp admin...";
const AUTO_REPLY_HINT =
  "👆 Pilih menu di bawah untuk jawaban otomatis. Ketik pesan sendiri akan langsung diteruskan ke admin.";
const HOURS_REPLY =
  "🕐 Kami online setiap hari 09.00–23.00 WIB. Di luar jam itu, pesan akan dibalas saat kami kembali online!";
const OFFLINE_WELCOME =
  "Halo! 👋 Saat ini kami sedang OFFLINE. Tinggalkan pesan, akan kami balas saat kembali online (09.00 WIB).";
const SUBSTATUS_ONLINE = "Biasanya balas dalam beberapa menit";
const SUBSTATUS_OFFLINE = "Online 09.00–23.00 WIB";

/** Pesan auto-reply untuk "Status Pesanan" (tidak ada sistem order tracking backend). */
const STATUS_REPLY =
  "📦 Untuk cek status pesanan, mohon beritahu kami Order ID / nomor WhatsApp yang dipakai saat order. Kamu bisa ketik detailnya di bawah ini, lalu akan diteruskan ke admin kami untuk dicek ya!";

/** Pesan auto-reply untuk "Chat Admin" — tetap di chat box (instruksi), redirect terpisah. */
const CHAT_ADMIN_REPLY =
  "👤 Baik! Kami arahkan kamu ke WhatsApp admin kami untuk dibantu lebih lanjut. 👇";

/** Jam operasional (WIB). Di luar ini = offline. */
const OPEN_HOUR = 9;
const CLOSE_HOUR = 23;
/** Detik tunggu sebelum auto-open (engagement). */
const AUTO_OPEN_DELAY = 12000;
/* ===================================================================== */

type Role = "cs" | "user";
type Msg = {
  id: number;
  role: Role;
  text: string;
  ts?: number;
  /** Tandai pesan user sudah diteruskan ke WhatsApp (read receipt). */
  sent?: boolean;
};

/* ===================== EXTERNAL STORE (localStorage) ===================== */
const CHAT_KEY = "akuma-wa-chat-v2";
const MUTE_KEY = "akuma-wa-mute-v2";
const AUTO_KEY = "akuma-wa-auto-v2";

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
 * Build daftar harga joki lengkap dari data GAMES (source of truth yang sama
 * dengan yang ditampilkan di halaman store). Dipakai untuk auto-reply
 * "Cek Harga Joki" — user tidak perlu redirect ke WA admin.
 */
function buildPriceListReply(): string {
  const lines: string[] = ["💰 *DAFTAR HARGA JOKI AKUMA*", ""];
  for (const g of GAMES) {
    lines.push(`${g.emoji} *${g.name}*`);
    for (const cat of g.categories) {
      lines.push(`  ${cat.icon} ${cat.name}`);
      for (const item of cat.items) {
        const tagStr = item.tag ? ` [${item.tag}]` : "";
        const reqStr = item.requirement ? ` ⚠️${item.requirement}` : "";
        lines.push(`    • ${item.name} — ${item.priceLabel}${tagStr}${reqStr}`);
      }
    }
    lines.push("");
  }
  lines.push("Ketik nama joki yang kamu mau, atau pilih 'Chat Admin' untuk order. 🚀");
  return lines.join("\n");
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

  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(true);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [now, setNow] = useState(() => Date.now());

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

  /* ---------- effects ---------- */
  // clock untuk update status online/offline tiap menit
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
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

  // auto-open setelah delay (throttle via sessionStorage, sekali per session)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(AUTO_KEY)) return;
    const id = window.setTimeout(() => {
      sessionStorage.setItem(AUTO_KEY, "1");
      setOpen(true);
      setHasNew(false);
    }, AUTO_OPEN_DELAY);
    return () => window.clearTimeout(id);
  }, []);

  /* ---------- logic ---------- */

  /**
   * Helper: push bubble user + (opsional) bubble CS auto-reply setelah jeda typing.
   * Dipakai untuk SEMUA quick-reply bertipe "auto" (tidak redirect ke WA admin).
   */
  const pushUserAndAutoReply = useCallback(
    (userText: string, csReply: string) => {
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
        writeChat([
          ...readChat(),
          { id: nextId(), role: "cs", text: csReply, ts: Date.now() },
        ]);
        if (!muted) playBlip("recv");
      }, 900);
    },
    [messages, muted]
  );

  /**
   * Kirim pesan FREE-TEXT (bukan dari template) → LANGSUNG redirect ke WhatsApp
   * admin dengan teks yang user ketik. Tidak ada auto-reply.
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

      // buka wa.me dengan teks ter-encode
      const encoded = encodeURIComponent(t);
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`,
        "_blank",
        "noopener,noreferrer"
      );

      // tandai pesan user sebagai "sent" (read receipt) setelah jeda singkat
      window.setTimeout(() => {
        writeChat(
          readChat().map((m) => (m.id === userMsg.id ? { ...m, sent: true } : m))
        );
      }, 500);

      // CS konfirmasi (dengan jeda typing)
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        writeChat([
          ...readChat(),
          { id: nextId(), role: "cs", text: REDIRECT_MSG, ts: Date.now() },
        ]);
        if (!muted) playBlip("recv");
      }, 950);

      if (!muted) playBlip("send");
    },
    [messages, muted]
  );

  /**
   * Handle quick-reply:
   *  - kind "auto"     → jawab otomatis di chat box (TIDAK redirect ke WA admin).
   *  - kind "redirect" → tampilkan instruksi di chat box + redirect ke WA admin.
   *
   * Pesan yang diketik user bebas (input manual) TIDAK lewat sini — itu langsung
   * ke sendMessage() = redirect ke admin.
   */
  const handleQuickReply = useCallback(
    (q: { label: string; emoji: string; kind: "auto" | "redirect" }) => {
      // === AUTO-REPLY (tidak redirect ke WA admin) ===
      if (q.kind === "auto") {
        let reply = "";
        if (q.label === "Cek Harga Joki") reply = buildPriceListReply();
        else if (q.label === "Status Pesanan") reply = STATUS_REPLY;
        else if (q.label === "Jam Operasional") reply = HOURS_REPLY;
        if (reply) {
          pushUserAndAutoReply(`${q.emoji} ${q.label}`, reply);
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

      // redirect ke WA admin dengan teks bawaan
      const waText = `Halo Admin Akuma Joki, saya mau bertanya/${q.label}`;
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`,
        "_blank",
        "noopener,noreferrer"
      );

      // tandai user message sent
      window.setTimeout(() => {
        writeChat(
          readChat().map((m) => (m.id === userMsg.id ? { ...m, sent: true } : m))
        );
      }, 500);

      // CS reply instruksi + konfirmasi redirect
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        writeChat([
          ...readChat(),
          { id: nextId(), role: "cs", text: CHAT_ADMIN_REPLY, ts: Date.now() },
          { id: nextId(), role: "cs", text: REDIRECT_MSG, ts: Date.now() },
        ]);
        if (!muted) playBlip("recv");
      }, 950);
    },
    [messages, muted, pushUserAndAutoReply]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggle = () => {
    setOpen((o) => !o);
    setHasNew(false);
  };

  const toggleMute = () => writeMute(!muted);
  const handleClear = () => {
    clearChat();
    setTyping(false);
  };

  const charCount = input.length;
  const nearLimit = charCount > 400;

  /* ============================ RENDER ============================ */
  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] print:hidden"
      aria-live="polite"
    >
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
                    "relative flex h-11 w-11 items-center justify-center rounded-full font-pixel text-[11px] text-[#0a0a0a]",
                    isOnline ? "bg-[#25D366]" : "bg-[#6b6478]"
                  )}
                  style={{
                    boxShadow: isOnline
                      ? "0 0 0 2px #0a0a0a, 0 0 0 4px #25D366, 0 0 12px rgba(37,211,102,0.7)"
                      : "0 0 0 2px #0a0a0a, 0 0 0 4px #6b6478",
                  }}
                  aria-hidden="true"
                >
                  AJ
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
                            className="font-pixel text-[7px] uppercase tracking-wide text-[#c44bff]"
                          >
                            Sedang mengetik...
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
                <span className="rounded-sm border border-[#2a2436] bg-[#121017] px-2 py-1 font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">
                  Hari ini
                </span>
              </div>

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

              {/* typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="relative flex items-end gap-2"
                  >
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <AvatarMini online={isOnline} />
                    </motion.div>
                    <div className="flex items-center gap-1 rounded-md rounded-bl-none border-2 border-[#2a2436] bg-[#1a1722] px-3 py-2.5">
                      <Dot delay="0ms" />
                      <Dot delay="150ms" />
                      <Dot delay="300ms" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== Quick Replies (sebelum user kirim pesan) ===== */}
            <AnimatePresence>
              {!userSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t-2 border-[#25D366]/30 bg-[#0a0a0a] px-3 py-2.5"
                >
                  {/* instruksi tegas: menu = auto, ketik = WA admin */}
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 bg-[#25D366] shadow-[0_0_6px_#25D366]" />
                    <p className="font-pixel text-[7px] uppercase tracking-wide text-[#6ee7b7]">
                      Menu Cepat — Auto Jawab
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => handleQuickReply(q)}
                        className={cn(
                          "btn-shine flex items-center gap-1 font-pixel text-[8px] uppercase tracking-wide pixel-corner px-2.5 py-1.5 transition-all active:translate-y-[1px]",
                          q.kind === "auto"
                            ? "text-[#25D366] border-2 border-[#25D366]/60 hover:bg-[#25D366] hover:text-[#0a0a0a] hover:shadow-[0_0_12px_rgba(37,211,102,0.6)]"
                            : "text-[#c44bff] border-2 border-[#a020f0]/60 hover:bg-[#a020f0] hover:text-[#ffffff] hover:shadow-[0_0_12px_rgba(160,32,240,0.6)]"
                        )}
                      >
                        <span aria-hidden="true">{q.emoji}</span>
                        {q.label}
                      </button>
                    ))}
                  </div>
                  {/* hint kecil di bawah menu */}
                  <p className="mt-2 font-pixel text-[6px] uppercase tracking-wide text-[#9a93a8]/80 leading-relaxed">
                    👆 = jawaban otomatis di sini &nbsp;·&nbsp; 👤 = lanjut ke WA admin
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== Input Area ===== */}
            <form
              onSubmit={handleSubmit}
              className="relative border-t-2 border-[#25D366]/40 bg-[#121017] px-2.5 py-2.5"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pesan → langsung ke WA admin"
                  aria-label="Ketik pesan untuk diteruskan ke admin WhatsApp"
                  maxLength={500}
                  className="min-w-0 flex-1 bg-[#0a0a0a] px-3 py-2.5 font-sans text-sm text-[#e5e5e5] placeholder:text-[#9a93a8] border-2 border-[#2a2436] pixel-corner outline-none transition-colors focus:border-[#25D366] focus:shadow-[0_0_10px_rgba(37,211,102,0.4)]"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Kirim pesan"
                  className="btn-shine flex h-11 w-11 shrink-0 items-center justify-center bg-[#25D366] text-[#0a0a0a] border-2 border-[#25D366] pixel-corner transition-all hover:bg-[#1ebe5d] hover:shadow-[0_0_14px_rgba(37,211,102,0.7)] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <Send className="size-4" />
                </button>
              </div>
              {/* char counter + footer notice */}
              <div className="mt-1.5 flex items-center justify-between px-1">
                <p className="font-pixel text-[6px] uppercase tracking-wide text-[#c44bff]">
                  ✦ Pesan ini → WA Admin
                </p>
                <p
                  className={cn(
                    "font-pixel text-[6px] uppercase tracking-wide transition-colors",
                    nearLimit ? "text-[#ff3b6b]" : "text-[#9a93a8]/60"
                  )}
                >
                  {charCount}/500
                </p>
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

function Bubble({ msg, isOnline }: { msg: Msg; isOnline: boolean }) {
  const isUser = msg.role === "user";
  const isRedirect = msg.role === "cs" && msg.text === REDIRECT_MSG;
  const isHours = msg.role === "cs" && msg.text === HOURS_REPLY;
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
      {!isUser && <AvatarMini online={isOnline} />}
      <div className={cn("max-w-[80%]", isUser && "order-1")}>
        <div
          className={cn(
            "px-3 py-2 font-sans text-sm leading-relaxed",
            isUser
              ? "rounded-md rounded-br-none border-2 border-[#0a0a0a] bg-[#25D366] text-[#0a0a0a]"
              : isHours
                ? "rounded-md rounded-bl-none border-2 border-[#a020f0]/60 bg-[#1a1722] text-[#e5e5e5]"
                : "rounded-md rounded-bl-none border-2 border-[#2a2436] bg-[#1a1722] text-[#e5e5e5]"
          )}
        >
          {msg.text}
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

function AvatarMini({ online }: { online: boolean }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-pixel text-[8px] text-[#0a0a0a]",
        online ? "bg-[#25D366]" : "bg-[#6b6478]"
      )}
      style={{
        boxShadow: online
          ? "0 0 0 1px #0a0a0a, 0 0 6px rgba(37,211,102,0.5)"
          : "0 0 0 1px #0a0a0a",
      }}
      aria-hidden="true"
    >
      AJ
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
