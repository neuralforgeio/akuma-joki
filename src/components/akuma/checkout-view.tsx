"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, ShoppingBag, User, Lock, MessageCircle,
  Gamepad2, Trash2, ShieldCheck, Eye, EyeOff, ShoppingCart, CheckCircle2,
} from "lucide-react";
import { useAkumaStore, useHasHydrated } from "@/lib/store";
import { WHATSAPP_NUMBER, getGameBySlug } from "@/lib/games-data";
import { PixelButton } from "./pixel-button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAdminStore, generateOrderId } from "@/lib/admin-store";
import { useCart } from "@/lib/cart";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Search } from "lucide-react";

export function CheckoutView() {
  const hydrated = useHasHydrated();
  const order = useAkumaStore((s) => s.order);
  const clearOrder = useAkumaStore((s) => s.clearOrder);
  const cartItems = useCart((s) => s.items);
  const cartRemove = useCart((s) => s.remove);
  const cartClear = useCart((s) => s.clear);
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [successModal, setSuccessModal] = useState<{ orderIds: string[] } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!hydrated) { return <CheckoutSkeleton />; }

  // Determine if we have cart items or single order
  const hasCart = cartItems.length > 0;
  const hasOrder = !!order;
  const hasAnything = hasCart || hasOrder;
  const game = getGameBySlug(order?.gameSlug ?? null);
  const canSubmit = hasAnything && username.trim().length > 0 && password.trim().length > 0 && agreed;

  const handleOrder = () => {
    if (!hasAnything) return;
    if (!username.trim() || !password.trim()) { toast({ title: "Data belum lengkap", description: "Isi username & password Roblox dulu ya.", variant: "destructive" }); return; }
    if (!agreed) { toast({ title: "Konfirmasi dulu", description: "Centang persetujuan untuk lanjut.", variant: "destructive" }); return; }

    // Generate 8-digit uppercase order IDs
    const orderIds: string[] = [];
    const numOrders = hasCart ? cartItems.length : 1;
    for (let i = 0; i < numOrders; i++) orderIds.push(generateOrderId());

    // Build message with order IDs
    let message = "";
    if (hasCart && cartItems.length > 1) {
      message = `*AKUMA JOKI - MULTI ORDER* 🔥\n\n*Daftar Joki:*\n`;
      cartItems.forEach((item, i) => {
        message += `${i + 1}. [${orderIds[i]}] ${item.gameEmoji} ${item.gameName} - ${item.productName} (${item.priceLabel})\n`;
      });
      message += `\n*Total Item:* ${cartItems.length}\n\n*Data Akun Roblox:*\n*Username:* ${username.trim()}\n*Password:* ${password.trim()}\n\nSaya sudah memesan multiple joki, mau lanjut ke pembayaran. Terima kasih!`;
    } else if (hasCart && cartItems.length === 1) {
      const item = cartItems[0];
      message = `*AKUMA JOKI - NEW ORDER* 🔥\n\n*Order ID: ${orderIds[0]}*\n\n*Game:* ${item.gameName}\n*Joki:* ${item.productName}\n*Harga:* ${item.priceLabel}\n\n*Data Akun Roblox:*\n*Username:* ${username.trim()}\n*Password:* ${password.trim()}\n\nSaya sudah memesan, mau lanjut ke pembayaran. Terima kasih!`;
    } else if (order) {
      message = `*AKUMA JOKI - NEW ORDER* 🔥\n\n*Order ID: ${orderIds[0]}*\n\n*Game:* ${order.gameName}\n*Joki:* ${order.productName}\n*Harga:* ${order.priceLabel}\n\n*Data Akun Roblox:*\n*Username:* ${username.trim()}\n*Password:* ${password.trim()}\n\nSaya sudah memesan, mau lanjut ke pembayaran. Terima kasih!`;
    }

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    try { const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; document.body.appendChild(a); a.click(); document.body.removeChild(a); } catch { window.open(url, "_blank"); }

    // Save orders to admin store with order IDs (auto-push to GitHub)
    try {
      if (hasCart) {
        cartItems.forEach((item, i) => {
          useAdminStore.getState().addOrder({ orderId: orderIds[i], gameName: item.gameName, productName: item.productName, priceLabel: item.priceLabel, username: username.trim(), password: password.trim() });
        });
        cartClear();
      } else if (order) {
        useAdminStore.getState().addOrder({ orderId: orderIds[0], gameName: order.gameName, productName: order.productName, priceLabel: order.priceLabel, username: username.trim(), password: password.trim() });
      }
      clearOrder();
    } catch { /* ignore */ }

    // Show success modal with order IDs
    setSuccessModal({ orderIds });
    toast({ title: "Membuka WhatsApp…", description: "Pesan order otomatis sudah disiapkan. Kirim ke admin ya!" });
  };

  const copyOrderId = (id: string) => {
    try { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch {}
  };

  return (
    <div className="relative">
      {/* header */}
      <section className="relative overflow-hidden border-b-2 border-[#a020f0]/40 scanlines">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-pixel text-[9px] uppercase text-[#9a93a8] hover:text-[#c44bff] transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Beranda
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center border-2 border-[#a020f0] pixel-corner bg-[#121017] shadow-[0_0_22px_rgba(160,32,240,0.5)]">
              <ShoppingBag className="size-7 text-[#c44bff]" />
            </div>
            <div>
              <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-[#a020f0]">
                CHECKOUT
              </p>
              <h1 className="mt-2 font-pixel text-xl sm:text-3xl text-[#e5e5e5] text-glow-neon">
                SELESAIKAN ORDER
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        {!hasAnything ? (
          <EmptyOrder />
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* left: form */}
            <div className="lg:col-span-3">
              <div className="border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner p-6 sm:p-8">
                <h2 className="font-pixel text-sm sm:text-base text-[#e5e5e5] text-glow-neon">
                  DATA AKUN ROBLOX
                </h2>
                <p className="mt-3 text-sm text-[#9a93a8]">
                  Isi data akun Roblox-mu dengan benar. Data hanya dipakai untuk proses joki.
                </p>

                <div className="mt-7 space-y-5">
                  <Field
                    label="Username Roblox"
                    icon={<User className="size-4" />}
                    type="text"
                    placeholder="Contoh: akuma_player123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Field
                    label="Password Roblox"
                    icon={<Lock className="size-4" />}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    toggleVisibility={{
                      show: showPassword,
                      onToggle: () => setShowPassword((v) => !v),
                    }}
                  />

                  {/* agreement */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 pixel-corner transition-colors ${
                        agreed
                          ? "bg-[#a020f0] border-[#a020f0]"
                          : "border-[#a020f0]/50 group-hover:border-[#a020f0]"
                      }`}
                    >
                      {agreed && <ShieldCheck className="size-3 text-white" />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span className="text-xs sm:text-sm text-[#bcb4c9] leading-relaxed">
                      Saya menyetujui data akun dipakai untuk proses joki &amp; memahami risiko
                      proses login oleh joki profesional AKUMA.
                    </span>
                  </label>

                  <PixelButton
                    size="xl"
                    className="w-full"
                    disabled={!canSubmit}
                    onClick={handleOrder}
                  >
                    <MessageCircle className="size-5" />
                    ORDER VIA WHATSAPP
                  </PixelButton>

                  <p className="text-center text-[10px] text-[#9a93a8]">
                    Tombol akan aktif setelah data terisi &amp; persetujuan dicentang.
                  </p>
                </div>
              </div>

              {/* trust badges */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <TrustBadge icon={<ShieldCheck className="size-4" />} text="Data Aman" />
                <TrustBadge icon={<MessageCircle className="size-4" />} text="Chat Langsung" />
                <TrustBadge icon={<Gamepad2 className="size-4" />} text="Joki Pro" />
              </div>
            </div>

            {/* right: summary */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 glass-strong rounded-2xl overflow-hidden">
                <div className="border-b border-white/8 px-5 py-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <ShoppingCart className="size-4 text-violet-400" /> Ringkasan Pesanan
                  </h3>
                  <button
                    onClick={() => { clearOrder(); cartClear(); setUsername(""); setPassword(""); setShowPassword(false); setAgreed(false); }}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                    aria-label="Hapus semua"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3">
                  {/* Cart items */}
                  {hasCart && cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                      <span className="text-2xl shrink-0">{item.gameEmoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-200 truncate">{item.productName}</p>
                        <p className="text-xs text-zinc-500">{item.gameName}</p>
                      </div>
                      <span className="text-sm font-bold text-violet-400 shrink-0">{item.priceLabel}</span>
                      <button onClick={() => cartRemove(item.id)} className="text-zinc-600 hover:text-red-400 shrink-0">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Single order (if no cart) */}
                  {!hasCart && order && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl" style={{ borderColor: game?.accent ?? "#8b5cf6" }}>
                          {game?.emoji ?? "🎮"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-500">Game</p>
                          <p className="text-sm text-zinc-200 truncate">{order.gameName}</p>
                        </div>
                      </div>
                      <SummaryRow label="Jenis Joki" value={order.productName} />
                      {order.category && <SummaryRow label="Kategori" value={order.category} />}
                    </>
                  )}

                  <div className="h-px w-full bg-white/8" />

                  <div className="flex items-end justify-between">
                    <span className="text-xs text-zinc-500">
                      {hasCart ? `Total (${cartItems.length} item)` : "Total Harga"}
                    </span>
                    <span className="text-2xl font-bold text-gradient">
                      {hasCart
                        ? cartItems.map(i => i.price).reduce((a, b) => a + b, 0) + "K"
                        : order?.priceLabel}
                    </span>
                  </div>

                  {/* steps */}
                  <div className="mt-4 border-t border-white/8 pt-4 space-y-3">
                    <Step n={1} text="Isi data akun Roblox" />
                    <Step n={2} text="Klik Order via WhatsApp" />
                    <Step n={3} text="Kirim pesan & lakukan pembayaran" />
                    <Step n={4} text="Joki diproses oleh admin" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Success Modal with Order IDs */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSuccessModal(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-nav-strong rounded-3xl max-w-md w-full p-6 sm:p-8 text-center"
              style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 border border-green-500/30"
              >
                <CheckCircle2 className="size-8 text-green-400" />
              </motion.div>

              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 mb-1">Order Berhasil Dibuat!</h2>
              <p className="text-sm text-zinc-500 mb-5">Simpan Order ID di bawah untuk melacak status joki kamu.</p>

              {/* Order IDs */}
              <div className="space-y-2 mb-5">
                {successModal.orderIds.map((id, i) => (
                  <div key={i} className="glass rounded-xl p-3 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[9px] uppercase text-zinc-500 tracking-wider">Order ID {successModal.orderIds.length > 1 ? `#${i + 1}` : ""}</p>
                      <p className="text-lg font-mono font-bold text-violet-400 tracking-wider">{id}</p>
                    </div>
                    <button
                      onClick={() => copyOrderId(id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 transition-all"
                    >
                      {copiedId === id ? <><Check className="size-3.5 text-green-400" /> Copied</> : <><Copy className="size-3.5" /> Copy</>}
                    </button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setSuccessModal(null); window.location.href = "/track-order"; }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all"
                >
                  <Search className="size-4" /> Track Order
                </button>
                <button
                  onClick={() => setSuccessModal(null)}
                  className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-all"
                >
                  Tutup
                </button>
              </div>

              <p className="mt-4 text-[10px] text-zinc-600">
                💡 Order ID juga terkirim ke WhatsApp admin. Status: <span className="text-yellow-400">Processing</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- sub ---------- */

function Field({
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  toggleVisibility,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Jika diisi, tampilkan tombol eye untuk show/hide password. */
  toggleVisibility?: { show: boolean; onToggle: () => void };
}) {
  return (
    <div>
      <label className="font-pixel text-[9px] uppercase tracking-wide text-[#9a93a8] flex items-center gap-2">
        <span className="text-[#c44bff]">{icon}</span>
        {label}
        {toggleVisibility && (
          <span className="ml-auto font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">
            {toggleVisibility.show ? "Terlihat" : "Tersembunyi"}
          </span>
        )}
      </label>
      <div className="relative mt-2">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] placeholder:text-[#5a5266] py-3 text-sm pixel-corner outline-none transition-colors focus:shadow-[0_0_14px_rgba(160,32,240,0.4)]",
            toggleVisibility ? "pl-4 pr-12" : "px-4"
          )}
        />
        {toggleVisibility && (
          <button
            type="button"
            onClick={toggleVisibility.onToggle}
            aria-label={toggleVisibility.show ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={toggleVisibility.show}
            title={toggleVisibility.show ? "Sembunyikan password" : "Tampilkan password untuk cek penulisan"}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner transition-colors hover:border-[#a020f0] hover:text-[#c44bff]"
          >
            {toggleVisibility.show ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>
      {toggleVisibility && (
        <p className="mt-1.5 font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8] leading-relaxed">
          👁 Klik ikon mata untuk cek apakah password sudah benar penulisannya
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-pixel text-[9px] uppercase text-[#9a93a8] shrink-0">{label}</span>
      <span className="text-sm text-[#e5e5e5] text-right break-words">{value}</span>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[#a020f0] text-[#c44bff] font-pixel text-[9px] pixel-corner">
        {n}
      </span>
      <span className="text-xs text-[#bcb4c9]">{text}</span>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 border border-[#2a2436] bg-[#121017]/60 pixel-corner px-2 py-3">
      <span className="text-[#c44bff]">{icon}</span>
      <span className="font-pixel text-[7px] uppercase text-[#9a93a8] text-center">{text}</span>
    </div>
  );
}

function EmptyOrder() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero card — centered, e-commerce style empty state */}
      <div className="glass-nav-strong rounded-3xl p-8 sm:p-12 text-center" style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}>
        {/* Illustration */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/30">
          <ShoppingBag className="size-10 text-violet-400" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
          Keranjang Anda Kosong
        </h2>
        <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
          Belum ada joki yang dipilih. Jelajahi store dan pilih joki favorit kamu untuk mulai order.
        </p>

        {/* Quick stats / suggestions */}
        <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div className="glass rounded-xl p-3">
            <ShieldCheck className="mx-auto size-5 text-violet-400 mb-1" />
            <p className="text-[10px] text-zinc-500">Aman</p>
          </div>
          <div className="glass rounded-xl p-3">
            <Gamepad2 className="mx-auto size-5 text-cyan-400 mb-1" />
            <p className="text-[10px] text-zinc-500">Pro Cepat</p>
          </div>
          <div className="glass rounded-xl p-3">
            <MessageCircle className="mx-auto size-5 text-green-400 mb-1" />
            <p className="text-[10px] text-zinc-500">24/7</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <PixelButton size="lg" asChild>
            <Link href="/store/blox-fruits">
              <Gamepad2 className="size-4" />
              Pilih Joki Sekarang
            </Link>
          </PixelButton>
          <PixelButton size="lg" variant="silver" asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </PixelButton>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[10px] text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-violet-400" /> Garansi Aman
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="size-3.5 text-green-400" /> CS Responsif
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gamepad2 className="size-3.5 text-cyan-400" /> Joki Pro
        </span>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="border-2 border-[#a020f0]/30 bg-[#121017] pixel-corner p-8 animate-pulse">
            <div className="h-4 w-40 bg-[#2a2436] rounded" />
            <div className="mt-4 h-3 w-full bg-[#2a2436] rounded" />
            <div className="mt-8 h-10 w-full bg-[#2a2436] rounded" />
            <div className="mt-5 h-10 w-full bg-[#2a2436] rounded" />
            <div className="mt-5 h-12 w-full bg-[#a020f0]/20 rounded" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="border-2 border-[#a020f0]/30 bg-[#0a0a0a] pixel-corner p-6 animate-pulse">
            <div className="h-4 w-32 bg-[#2a2436] rounded" />
            <div className="mt-6 h-16 w-full bg-[#2a2436] rounded" />
            <div className="mt-4 h-3 w-full bg-[#2a2436] rounded" />
            <div className="mt-2 h-3 w-2/3 bg-[#2a2436] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
