"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Wallet,
  ChevronDown,
  Flame,
  Gamepad2,
  Trophy,
  Star,
  ArrowRight,
  Headphones,
  Clock,
} from "lucide-react";
import { GAMES as DEFAULT_GAMES } from "@/lib/games-data";
import type { Game } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "./pixel-button";
import { Reveal } from "./reveal";
import { Starfield, MovingGrid } from "./backgrounds";

/**
 * AnimatedHeading — heading "AKUMA JOKI" dengan animasi timbul-timbul looping
 * yang berganti-ganti teks dengan efek transition keren. Setiap teks muncul
 * dengan efek scale+blur+glow, hold beberapa detik, lalu fade out ke teks berikutnya.
 */
const HEADING_TEXTS = [
  { main: "AKUMA", accent: "JOKI", subtitle: "Joki & Store Roblox" },
  { main: "LEVEL", accent: "UP", subtitle: "Naik level cepat" },
  { main: "RAID", accent: "CLEAR", subtitle: "Taklukkan semua raid" },
  { main: "SAFE", accent: "& FAST", subtitle: "Aman & harga bersahabat" },
  { main: "PRO", accent: "JOKI", subtitle: "Joki profesional" },
];

function AnimatedHeading() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // ganti teks setiap 3.5 detik
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % HEADING_TEXTS.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, []);

  const cur = HEADING_TEXTS[idx];

  return (
    <div className="mt-6 flex flex-col items-start">
      <div className="relative min-h-[1.4em] sm:min-h-[1.3em] md:min-h-[1.2em] mb-3">
        <AnimatePresence mode="wait">
          <motion.h1
            key={idx}
            initial={{ opacity: 0, y: 12, scale: 0.92, filter: "blur(6px)" }}
            animate={{
              opacity: 1,
              y: [12, -2, 0],
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{ opacity: 0, y: -8, scale: 1.05, filter: "blur(4px)" }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              y: { duration: 0.8, times: [0, 0.6, 1], ease: "easeOut" },
            }}
            className="font-pixel text-3xl sm:text-5xl md:text-6xl leading-tight text-[#e5e5e5] text-glow-neon inline-flex"
          >
            {cur.main} <span className="text-[#a020f0] ml-3">{cur.accent}</span>
          </motion.h1>
        </AnimatePresence>
      </div>
      {/* subtitle dengan fade sync */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`sub-${idx}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="font-pixel text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#c44bff]"
        >
          {cur.subtitle}
        </motion.p>
      </AnimatePresence>
      {/* progress dots */}
      <div className="mt-3 flex gap-1.5">
        {HEADING_TEXTS.map((_, i) => (
          <span
            key={i}
            className={`h-1 transition-all duration-300 ${
              i === idx ? "w-6 bg-[#a020f0] shadow-[0_0_6px_#a020f0]" : "w-1.5 bg-[#2a2436]"
            }`}
            style={{ borderRadius: 0 }}
          />
        ))}
      </div>
    </div>
  );
}

export function HomeView() {
  const gamesRef = useRef<HTMLDivElement>(null);
  // Baca games dari admin store (ter-sync dari GitHub). Fallback ke DEFAULT_GAMES.
  const adminGames = useAdminStore((s) => s.games);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const games: Game[] =
    hydrated && adminGames.length > 0 ? adminGames : DEFAULT_GAMES;

  const scrollToGames = () => {
    gamesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden scanlines">
        {/* Pure-CSS GPU backgrounds (no Framer Motion) */}
        <Starfield />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#a020f0]/25 blur-[100px]" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-[#a020f0]/20 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="flex flex-col items-center text-center">
            {/* logo */}
            <div className="relative h-28 w-56 sm:h-40 sm:w-80 logo-glow rounded-md float-slow overflow-hidden">
              <Image
                src="/akuma-logo.png"
                alt="AKUMA JOKI"
                fill
                sizes="(min-width: 640px) 320px, 224px"
                className="object-contain"
                priority
              />
            </div>

            {/* badge */}
            <div className="mt-8 inline-flex items-center gap-2 border-2 border-[#a020f0]/60 px-3 py-2 pixel-corner bg-[#a020f0]/5">
              <span className="h-2 w-2 rounded-full bg-[#6ee7b7] shadow-[0_0_8px_#6ee7b7] animate-pulse" />
              <span className="font-pixel text-[8px] sm:text-[9px] uppercase text-[#e5e5e5] tracking-wider">
                Online • Order Diterima
              </span>
            </div>

            {/* title — animated cycling heading */}
            <AnimatedHeading />

            <p className="mt-6 max-w-2xl text-sm sm:text-base text-[#bcb4c9] leading-relaxed">
              Joki &amp; Store Roblox premium dengan vibe{" "}
              <span className="text-[#c44bff] font-semibold">retro pixel</span>. Naik level,
              taklukkan raid, dan koleksi senjata langka bareng joki profesional kami. Aman,
              cepat, harga bersahabat.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col sm:flex-row items-center gap-4">
              <PixelButton size="lg" onClick={scrollToGames}>
                <Gamepad2 className="size-4" />
                Pilih Joki
              </PixelButton>
              <PixelButton size="lg" variant="silver" asChild>
                <Link href="/store/blox-fruits">
                  Lihat Store
                  <ArrowRight className="size-4" />
                </Link>
              </PixelButton>
            </div>

            {/* stats */}
            <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl">
              <Stat value="1.2K+" label="Order Selesai" icon={<Trophy className="size-3.5" />} />
              <Stat value="24/7" label="Fast Response" icon={<Clock className="size-3.5" />} />
              <Stat value="100%" label="Aman" icon={<ShieldCheck className="size-3.5" />} />
            </div>

            {/* scroll hint */}
            <button
              onClick={scrollToGames}
              className="mt-12 flex flex-col items-center gap-1 text-[#9a93a8] hover:text-[#c44bff] transition-colors"
            >
              <span className="font-pixel text-[8px] uppercase">Scroll</span>
              <ChevronDown className="size-4 animate-bounce" />
            </button>
          </div>
        </div>

        {/* marquee */}
        <div className="relative border-y-2 border-[#a020f0]/50 bg-[#a020f0]/5 py-3 overflow-hidden">
          <div className="marquee-track">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="font-pixel text-[9px] sm:text-[10px] text-[#e5e5e5] mx-6">
                🔥 BLOX FRUITS ⚔️ EXPEDITION ANTARCTICA 🏔️ RETAIL TYCOON 2 🏪 JOKI PRO ⚡ AMAN &amp; TERPERCAYA 🛡️ HARGA BERSAHABAT 💰{" "}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GAME CARDS ============ */}
      <section ref={gamesRef} className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <SectionHeading
          kicker="PILIH GAME"
          title="STORE GAME"
          subtitle="Pilih game favoritmu, lalu lihat daftar joki yang tersedia."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {games.map((g, idx) => (
            <Reveal key={g.slug} delay={idx * 90}>
              <Link href={`/store/${g.slug}`} className="group block h-full text-left">
                <GameCard game={g} />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ WHY CHOOSE ============ */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 border-t-2 border-[#a020f0]/30">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="relative">
          <SectionHeading
            kicker="KEUNGGULAN"
            title="KENAPA PILIH AKUMA JOKI?"
            subtitle="Bukan joki abal-abal. Kami serius bikin kamu jadi top player."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Reveal>
              <FeatureCard
                icon={<ShieldCheck className="size-7" />}
                title="AMAN & TERPERCAYA"
                desc="Akunmu ditangani joki profesional dengan prosedur aman. Reputasi terjaga, ribuan order selesai tanpa masalah."
                accent="#a020f0"
              />
            </Reveal>
            <Reveal delay={120}>
              <FeatureCard
                icon={<Zap className="size-7" />}
                title="PROSES CEPAT"
                desc="Order langsung diproses, progress real-time via WhatsApp. Gak pake lama, langsung gas!"
                accent="#7fd4ff"
              />
            </Reveal>
            <Reveal delay={240}>
              <FeatureCard
                icon={<Wallet className="size-7" />}
                title="HARGA BERSAHABAT"
                desc="Harga joki paling bersahabat di kelasnya. Mulai 2K saja, dompet aman, hasil maximal."
                accent="#ffd166"
              />
            </Reveal>
          </div>

          {/* extra mini features */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MiniFeature icon={<Headphones className="size-4" />} text="Admin Responsif 24/7" />
            <MiniFeature icon={<Star className="size-4" />} text="Review Positif dari Player" />
            <MiniFeature icon={<Flame className="size-4" />} text="Joki Pro Berpengalaman" />
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden pixel-border bg-[#121017] p-8 sm:p-12 text-center scanlines">
          <MovingGrid />
          <div className="relative">
            <h3 className="font-pixel text-lg sm:text-2xl text-[#e5e5e5] text-glow-neon">
              SIAP JADI <span className="text-[#a020f0]">TOP PLAYER?</span>
            </h3>
            <p className="mt-4 text-sm text-[#bcb4c9] max-w-lg mx-auto">
              Gas mulai sekarang. Pilih game, pilih joki, order via WhatsApp. Selesai!
            </p>
            <div className="mt-7 flex justify-center">
              <PixelButton size="lg" onClick={scrollToGames}>
                <Gamepad2 className="size-4" />
                Mulai Order
              </PixelButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- sub components ---------- */

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-2 border-[#a020f0]/40 bg-[#121017]/70 pixel-corner p-3 sm:p-4">
      <div className="flex items-center justify-center gap-1.5 text-[#c44bff]">{icon}</div>
      <p className="mt-2 font-pixel text-sm sm:text-base text-[#e5e5e5]">{value}</p>
      <p className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-wide text-[#9a93a8]">
        {label}
      </p>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  return (
    <div className="relative h-full akuma-card-hover border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner overflow-hidden group-hover:border-[#a020f0] group-hover:shadow-[0_0_30px_rgba(160,32,240,0.5)]">
      {/* header band */}
      <div className="relative h-32 sm:h-40 overflow-hidden bg-gradient-to-br from-[#1a1722] to-[#0a0a0a] flex items-center justify-center">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <span className="relative text-6xl sm:text-7xl drop-shadow-[0_0_18px_rgba(160,32,240,0.6)] transition-transform duration-300 group-hover:scale-110">
          {game.emoji}
        </span>
        {/* corner tag */}
        <span className="absolute top-2 right-2 font-pixel text-[7px] uppercase px-2 py-1 bg-[#a020f0] text-white pixel-corner">
          {game.categories.reduce((a, c) => a + c.items.length, 0)} Joki
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-pixel text-sm sm:text-base text-[#e5e5e5] group-hover:text-[#c44bff] transition-colors">
          {game.name}
        </h3>
        <p className="mt-2 font-pixel text-[8px] uppercase tracking-wide" style={{ color: game.accent }}>
          {game.tagline}
        </p>
        <p className="mt-3 text-xs text-[#9a93a8] leading-relaxed flex-1">{game.description}</p>

        {/* categories preview */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {game.categories.map((c) => (
            <span
              key={c.id}
              className="font-pixel text-[7px] uppercase px-2 py-1 border border-[#2a2436] text-[#bcb4c9] pixel-corner"
            >
              {c.icon} {c.name}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="font-pixel text-[9px] text-[#9a93a8] uppercase">Mulai 2K</span>
          <span className="font-pixel text-[10px] text-[#c44bff] inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
            Buka Store <ArrowRight className="size-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="group relative h-full akuma-card-hover border-2 border-[#a020f0]/40 bg-[#121017] pixel-corner p-6 group-hover:border-[#a020f0] group-hover:shadow-[0_0_26px_rgba(160,32,240,0.45)]">
      {/* pixel icon box */}
      <div
        className="inline-flex h-14 w-14 items-center justify-center border-2 pixel-corner text-[#0a0a0a] transition-transform group-hover:scale-110"
        style={{ background: accent, borderColor: accent, boxShadow: `0 0 16px ${accent}88` }}
      >
        {icon}
      </div>
      <h4 className="mt-5 font-pixel text-xs sm:text-sm text-[#e5e5e5] text-glow-neon">{title}</h4>
      <p className="mt-3 text-sm text-[#bcb4c9] leading-relaxed">{desc}</p>
    </div>
  );
}

function MiniFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 border border-[#2a2436] bg-[#121017]/60 pixel-corner px-4 py-3">
      <span className="text-[#c44bff]">{icon}</span>
      <span className="text-sm text-[#e5e5e5]">{text}</span>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <Reveal>
        <p className="font-pixel text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[#a020f0]">
          {kicker}
        </p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="mt-3 font-pixel text-xl sm:text-3xl text-[#e5e5e5] text-glow-neon">
          {title}
        </h2>
      </Reveal>
      <Reveal delay={160}>
        <p className="mt-4 text-sm text-[#9a93a8] max-w-xl mx-auto">{subtitle}</p>
      </Reveal>
    </div>
  );
}
