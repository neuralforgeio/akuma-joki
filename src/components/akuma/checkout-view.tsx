"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Lock,
  MessageCircle,
  AlertTriangle,
  Gamepad2,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAkumaStore, useHasHydrated } from "@/lib/store";
import { WHATSAPP_NUMBER, getGameBySlug } from "@/lib/games-data";
import { PixelButton } from "./pixel-button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function CheckoutView() {
  const hydrated = useHasHydrated();
  const order = useAkumaStore((s) => s.order);
  const clearOrder = useAkumaStore((s) => s.clearOrder);
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Until the persisted store rehydrates on the client, render a neutral
  // skeleton to avoid SSR/client hydration mismatch.
  if (!hydrated) {
    return <CheckoutSkeleton />;
  }

  const hasOrder = !!order;
  const game = getGameBySlug(order?.gameSlug ?? null);
  const canSubmit = hasOrder && username.trim().length > 0 && password.trim().length > 0 && agreed;

  const handleOrder = () => {
    if (!order) return;
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Data belum lengkap",
        description: "Isi username & password Roblox dulu ya.",
        variant: "destructive",
      });
      return;
    }
    if (!agreed) {
      toast({
        title: "Konfirmasi dulu",
        description: "Centang persetujuan untuk lanjut.",
        variant: "destructive",
      });
      return;
    }

    const message =
      `*AKUMA JOKI - NEW ORDER* 🔥\n\n` +
      `*Game:* ${order.gameName}\n` +
      `*Joki:* ${order.productName}\n` +
      `*Harga:* ${order.priceLabel}\n\n` +
      `*Data Akun Roblox:*\n` +
      `*Username:* ${username.trim()}\n` +
      `*Password:* ${password.trim()}\n\n` +
      `Saya sudah memesan, mau lanjut ke pembayaran. Terima kasih!`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    // anchor click untuk hindari proxy corrupt emoji di URL
    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, "_blank");
    }

    toast({
      title: "Membuka WhatsApp…",
      description: "Pesan order otomatis sudah disiapkan. Kirim ke admin ya!",
    });
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
        {!hasOrder ? (
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
              <div className="lg:sticky lg:top-24 border-2 border-[#a020f0]/50 bg-[#0a0a0a] pixel-corner overflow-hidden">
                <div className="border-b-2 border-[#a020f0]/40 bg-[#a020f0]/10 px-5 py-4 flex items-center justify-between">
                  <h3 className="font-pixel text-[10px] sm:text-xs uppercase text-[#e5e5e5]">
                    Ringkasan Pesanan
                  </h3>
                  <button
                    onClick={() => {
                      clearOrder();
                      setUsername("");
                      setPassword("");
                      setShowPassword(false);
                      setAgreed(false);
                    }}
                    className="text-[#9a93a8] hover:text-[#ff3b6b] transition-colors"
                    aria-label="Hapus pesanan"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center border-2 pixel-corner text-3xl"
                      style={{
                        borderColor: game?.accent ?? "#a020f0",
                        boxShadow: `0 0 16px ${game?.accent ?? "#a020f0"}55`,
                      }}
                    >
                      {game?.emoji ?? "🎮"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-pixel text-[9px] uppercase text-[#9a93a8]">Game</p>
                      <p className="font-pixel text-[11px] text-[#e5e5e5] mt-1 truncate">
                        {order!.gameName}
                      </p>
                    </div>
                  </div>

                  <SummaryRow label="Jenis Joki" value={order!.productName} />
                  {order!.category && <SummaryRow label="Kategori" value={order!.category} />}

                  <div className="h-px w-full bg-[#2a2436]" />

                  <div className="flex items-end justify-between">
                    <span className="font-pixel text-[10px] uppercase text-[#9a93a8]">
                      Total Harga
                    </span>
                    <span className="font-pixel text-2xl sm:text-3xl text-[#c44bff] text-glow-neon">
                      {order!.priceLabel}
                    </span>
                  </div>

                  {/* steps */}
                  <div className="mt-4 border-t-2 border-[#2a2436] pt-4 space-y-3">
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
    <div className="mx-auto max-w-2xl text-center">
      <div className="relative inline-block">
        <div className="relative h-24 w-48 sm:h-28 sm:w-56 logo-glow rounded-md mx-auto float-slow overflow-hidden">
          <Image
            src="/akuma-logo.png"
            alt="AKUMA JOKI"
            fill
            sizes="(min-width: 640px) 224px, 192px"
            className="object-contain"
          />
        </div>
      </div>
      <div className="mt-8 inline-flex items-center gap-2 border-2 border-[#ff3b6b]/60 bg-[#ff3b6b]/10 px-4 py-2 pixel-corner">
        <AlertTriangle className="size-4 text-[#ff3b6b]" />
        <span className="font-pixel text-[9px] uppercase text-[#ff8aa3]">Belum ada order</span>
      </div>
      <h2 className="mt-6 font-pixel text-base sm:text-xl text-[#e5e5e5] text-glow-neon leading-relaxed">
        ANDA BELUM MEMILIH JOKI APAPUN!
      </h2>
      <p className="mt-4 text-sm text-[#bcb4c9] max-w-md mx-auto">
        Silakan pilih joki terlebih dahulu dari store game untuk melanjutkan ke proses checkout.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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
