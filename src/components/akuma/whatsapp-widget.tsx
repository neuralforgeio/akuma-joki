"use client";

/**
 * AKUMA JOKI — Floating WhatsApp Live Chat Widget
 * --------------------------------------------------------------
 * 100% frontend-only. Pesan diteruskan via link wa.me (tab baru).
 * Tema: Retro PixelArt — font-pixel, pixel-corner, neon glow, scanlines.
 *
 * Perilaku:
 *  - Floating button (bulat, hijau WhatsApp #25D366) dengan pulse ring.
 *  - Toggle popup chat box (slide-up + fade-in via Framer Motion).
 *  - Header: avatar "AJ", nama CS, status Online.
 *  - Body: bubble sambutan CS + quick reply chips.
 *  - Input area: text input + tombol kirim (paper plane).
 *  - Kirim -> push bubble user -> window.open(wa.me) -> bubble CS konfirmasi.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================ KONFIGURASI ============================ */
const WHATSAPP_NUMBER = "6281234567890"; // Ganti dengan nomor asli nanti
const CS_NAME = "Akuma Joki";
const WELCOME_MESSAGE =
  "Halo! 👋 Selamat datang di Akuma Joki. Ada yang bisa kami bantu?";

const QUICK_REPLIES = ["Cek Harga Joki", "Status Pesanan", "Chat Admin"];
const REDIRECT_MSG = "Pesan dikirim, mengarahkan ke WhatsApp...";
const SUBSTATUS = "Biasanya balas dalam beberapa menit";
/* ===================================================================== */

type Role = "cs" | "user";
type Msg = { id: number; role: Role; text: string; ts: number };

/** Ikon WhatsApp resmi (inline SVG) supaya tetap on-brand tanpa依赖 tambahan. */
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

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasNew, setHasNew] = useState(true); // badge notif sebelum dibuka
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const idRef = useRef(2);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Msg[]>([
    { id: 1, role: "cs", text: WELCOME_MESSAGE, ts: 0 },
  ]);

  /* ---------- effects ---------- */
  useEffect(() => {
    setMounted(true);
    // set timestamp welcome setelah mount (hindari hydration mismatch)
    setMessages((m) =>
      m.map((msg) => (msg.id === 1 ? { ...msg, ts: Date.now() } : msg))
    );
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

  // fokus input saat dibuka
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 220);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  /* ---------- logic ---------- */
  const sendMessage = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;

    const userMsg: Msg = { id: idRef.current++, role: "user", text: t, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // buka wa.me dengan teks ter-encode
    const encoded = encodeURIComponent(t);
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`,
      "_blank",
      "noopener,noreferrer"
    );

    // CS konfirmasi (dengan jeda typing)
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: "cs", text: REDIRECT_MSG, ts: Date.now() },
      ]);
    }, 950);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggle = () => {
    setOpen((o) => !o);
    setHasNew(false);
  };

  const userSent = messages.some((m) => m.role === "user");

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
              "h-[30rem] max-h-[calc(100vh-7rem)]",
              "bg-[#121017] text-[#e5e5e5]",
              "border-2 border-[#25D366] pixel-corner scanlines",
              "shadow-[0_0_0_2px_#0a0a0a,0_0_0_4px_#25D366,0_0_28px_rgba(37,211,102,0.45),0_18px_40px_-12px_rgba(0,0,0,0.8)]"
            )}
          >
            {/* ===== Header ===== */}
            <div className="relative flex items-center gap-3 border-b-2 border-[#25D366]/40 bg-[#0a0a0a] px-3 py-3">
              {/* halo neon di belakang avatar */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-[#25D366]/40 blur-md" />
                <div
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] font-pixel text-[11px] text-[#0a0a0a]"
                  style={{
                    boxShadow:
                      "0 0 0 2px #0a0a0a, 0 0 0 4px #25D366, 0 0 12px rgba(37,211,102,0.7)",
                  }}
                  aria-hidden="true"
                >
                  AJ
                </div>
                {/* online dot */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0a] bg-[#6ee7b7]"
                  style={{ boxShadow: "0 0 8px rgba(110,231,183,0.9)" }}
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
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#6ee7b7]" />
                  <p className="font-pixel text-[7px] uppercase tracking-wide text-[#6ee7b7]">
                    Online · {SUBSTATUS}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup chat"
                className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner transition-colors hover:border-[#ff3b6b] hover:text-[#ff3b6b]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* ===== Body ===== */}
            <div
              ref={bodyRef}
              className="relative flex-1 space-y-3 overflow-y-auto bg-[#0a0a0a] px-3 py-4"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 0%, rgba(37,211,102,0.06), transparent 60%)",
              }}
            >
              {/* tanggal chip */}
              <div className="flex justify-center">
                <span className="rounded-sm border border-[#2a2436] bg-[#121017] px-2 py-1 font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">
                  Hari ini
                </span>
              </div>

              {messages.map((m) => (
                <Bubble key={m.id} msg={m} mounted={mounted} />
              ))}

              {/* typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="flex items-end gap-2"
                  >
                    <AvatarMini />
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
                  className="flex flex-wrap gap-2 border-t-2 border-[#25D366]/30 bg-[#0a0a0a] px-3 py-2.5"
                >
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="btn-shine font-pixel text-[8px] uppercase tracking-wide text-[#25D366] border-2 border-[#25D366]/60 px-2.5 py-1.5 pixel-corner transition-all hover:bg-[#25D366] hover:text-[#0a0a0a] hover:shadow-[0_0_12px_rgba(37,211,102,0.6)] active:translate-y-[1px]"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== Input Area ===== */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t-2 border-[#25D366]/40 bg-[#121017] px-2.5 py-2.5"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan..."
                aria-label="Ketik pesan"
                maxLength={500}
                className="min-w-0 flex-1 bg-[#0a0a0a] px-3 py-2.5 font-sans text-sm text-[#e5e5e5] placeholder:text-[#9a93a8] border-2 border-[#2a2436] pixel-corner outline-none transition-colors focus:border-[#25D366] focus:shadow-[0_0_10px_rgba(37,211,102,0.4)]"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Kirim pesan"
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#25D366] text-[#0a0a0a] border-2 border-[#25D366] pixel-corner transition-all hover:bg-[#1ebe5d] hover:shadow-[0_0_14px_rgba(37,211,102,0.7)] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Floating Button ===== */}
      <div className="flex justify-end">
        <motion.button
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
          {/* pulse ring (denut halus) */}
          {!open && (
            <span
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#25D366]"
              style={{ animation: "wa-ping 2.2s cubic-bezier(0,0,0.2,1) infinite" }}
              aria-hidden="true"
            />
          )}

          {/* badge notif */}
          {hasNew && !open && (
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

      {/* keyframes injected locally (ping ring + typing dots) */}
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
      `}</style>
    </div>
  );
}

/* ============================ Sub-components ============================ */

function Bubble({ msg, mounted }: { msg: Msg; mounted: boolean }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && <AvatarMini />}
      <div className={cn("max-w-[78%]", isUser && "order-1")}>
        <div
          className={cn(
            "px-3 py-2 font-sans text-sm leading-relaxed",
            isUser
              ? "rounded-md rounded-br-none border-2 border-[#0a0a0a] bg-[#25D366] text-[#0a0a0a]"
              : "rounded-md rounded-bl-none border-2 border-[#2a2436] bg-[#1a1722] text-[#e5e5e5]"
          )}
        >
          {msg.text}
        </div>
        <p
          className={cn(
            "mt-1 font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]",
            isUser ? "text-right" : "text-left"
          )}
        >
          {mounted && msg.ts ? formatTime(msg.ts) : ""}
        </p>
      </div>
    </motion.div>
  );
}

function AvatarMini() {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#25D366] font-pixel text-[8px] text-[#0a0a0a]"
      style={{ boxShadow: "0 0 0 1px #0a0a0a, 0 0 6px rgba(37,211,102,0.5)" }}
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
