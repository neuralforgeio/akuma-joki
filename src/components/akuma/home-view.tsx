"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Zap, Wallet, ChevronDown, Flame, Gamepad2, Trophy, Star, ArrowRight, Headphones, Clock } from "lucide-react";
import { GAMES as DEFAULT_GAMES } from "@/lib/games-data";
import type { Game } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { useReviews } from "@/lib/reviews";
import { useI18n } from "@/lib/i18n";
import { PixelButton } from "./pixel-button";
import { Reveal } from "./reveal";
import { Starfield, MovingGrid } from "./backgrounds";
import { SkeletonGameCard } from "./skeleton";
import { RecentlyViewed } from "./recently-viewed";

const HEADING_TEXTS = [
  { main: "AKUMA", accent: "JOKI", subtitle: "Joki & Store Roblox" },
  { main: "LEVEL", accent: "UP", subtitle: "Naik level cepat" },
  { main: "RAID", accent: "CLEAR", subtitle: "Taklukkan semua raid" },
  { main: "SAFE", accent: "& FAST", subtitle: "Aman & harga bersahabat" },
  { main: "PRO", accent: "JOKI", subtitle: "Joki profesional" },
];

function AnimatedHeading() {
  const [idx, setIdx] = useState(0);
  useEffect(() => { const id = setInterval(() => setIdx(i => (i + 1) % HEADING_TEXTS.length), 3500); return () => clearInterval(id); }, []);
  const cur = HEADING_TEXTS[idx];
  return (
    <div className="mt-8 flex flex-col items-start">
      <div className="relative min-h-[1.4em] sm:min-h-[1.3em] md:min-h-[1.2em] mb-3">
        <AnimatePresence mode="wait">
          <motion.h1 key={idx} initial={{ opacity:0, y:12, scale:0.92, filter:"blur(6px)" }} animate={{ opacity:1, y:[12,-2,0], scale:1, filter:"blur(0px)" }} exit={{ opacity:0, y:-8, scale:1.05, filter:"blur(4px)" }} transition={{ duration:0.5, ease:"easeOut", y:{ duration:0.8, times:[0,0.6,1], ease:"easeOut" } }} className="font-pixel text-3xl sm:text-5xl md:text-6xl leading-tight text-gradient">
            {cur.main} <span className="text-violet-400 ml-3">{cur.accent}</span>
          </motion.h1>
        </AnimatePresence>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={`sub-${idx}`} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }} transition={{ duration:0.35, delay:0.12 }} className="text-sm sm:text-base text-zinc-400">{cur.subtitle}</motion.p>
      </AnimatePresence>
      <div className="mt-4 flex gap-1.5">
        {HEADING_TEXTS.map((_, i) => (<span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-gradient-to-r from-violet-500 to-violet-400" : "w-1.5 bg-white/10"}`} />))}
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  { name: "RizkyGaming", initials: "RG", game: "Blox Fruits", item: "200 Level", accent: "#8b5cf6", review: "Pelayanan cepat banget! 200 level selesai dalam 1 hari. Adminnya ramah dan selalu update progres. Recommended!" },
  { name: "FrozenMaster", initials: "FM", game: "Expedition Antarctica", item: "Muncak 1-25", accent: "#22d3ee", review: "Muncak 1-25 kelar cepat, harga bersahabat. Akun aman, nggak ada masalah sama sekali. Bakal langganan!" },
  { name: "TycoonKing", initials: "TK", game: "Retail Tycoon 2", item: "Main Sampai Pro", accent: "#fbbf24", review: "Toko saya jadi profit maksimal! Joki profesional, sabar, dan ngerti banget strategi retail. Top!" },
];

export function HomeView() {
  const gamesRef = useRef<HTMLDivElement>(null);
  const adminGames = useAdminStore((s) => s.games);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const games: Game[] = hydrated && adminGames.length > 0 ? adminGames : DEFAULT_GAMES;
  const t = useI18n((s) => s.t);
  // Subscribe to lang so this component re-renders when language changes
  // (the t function reference is stable and won't trigger re-render by itself)
  useI18n((s) => s.lang);
  const scrollToGames = () => gamesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="flex flex-col items-start">
            {/* Logo */}
            <div className="relative h-16 w-28 sm:h-20 sm:w-36 mb-6 float-slow">
              <Image src="/akuma-logo.png" alt="AKUMA JOKI" fill sizes="144px" className="object-contain" priority />
            </div>

            {/* Status badge */}
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-zinc-400">Online · Order Diterima</span>
            </div>

            <AnimatedHeading />

            <p className="mt-6 max-w-xl text-base sm:text-lg text-zinc-400 leading-relaxed">
              {t("home.heroSubtitle")}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <PixelButton size="lg" onClick={scrollToGames} className="w-full sm:w-auto">
                <Gamepad2 className="size-4" /> {t("home.chooseJoki")}
              </PixelButton>
              <PixelButton size="lg" variant="silver" asChild className="w-full sm:w-auto">
                <Link href="/store/blox-fruits">{t("home.viewStore")} <ArrowRight className="size-4" /></Link>
              </PixelButton>
            </div>

            {/* Stats */}
            <div className="mt-10 flex flex-wrap gap-6 sm:gap-10">
              {[
                { value: "1.2K+", label: t("home.statsOrders") },
                { value: "24/7", label: t("home.statsSupport") },
                { value: "100%", label: t("home.statsSafe") },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl sm:text-3xl font-bold text-gradient">{s.value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="relative border-y border-white/5 overflow-hidden py-3">
          <div className="marquee-track">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="text-sm text-zinc-500 mx-6">🔥 BLOX FRUITS ⚔️ EXPEDITION ANTARCTICA 🏔️ RETAIL TYCOON 2 🏪 JOKI PRO ⚡ AMAN & TERPERCAYA 🛡️ HARGA BERSAHABAT 💰 </span>
            ))}
          </div>
        </div>
      </section>

      {/* GAME CARDS */}
      <section ref={gamesRef} className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest mb-2">{t("home.pilihGame")}</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient">{t("home.storeGame")}</h2>
          <p className="mt-2 text-sm text-zinc-500">{t("home.gameCardDesc")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {!hydrated ? Array.from({ length: 3 }).map((_, i) => <SkeletonGameCard key={i} />) :
            games.map((g, idx) => (
              <Reveal key={g.slug} delay={idx * 90}>
                <Link href={`/store/${g.slug}`} className="group block h-full">
                  <div className="card-lux h-full overflow-hidden">
                    <div className="flex h-24 items-center justify-center border-b border-white/5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${g.accent}15, transparent)` }}>
                      <span className="text-4xl group-hover:scale-110 transition-transform duration-500">{g.emoji}</span>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-zinc-100">{g.name}</h3>
                      <p className="text-sm text-zinc-500 mt-1">{g.tagline}</p>
                      <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{g.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {g.categories.map((c) => (<span key={c.id} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-zinc-400 border border-white/5">{c.icon} {c.name}</span>))}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-zinc-600">{g.categories.reduce((a, c) => a + c.items.length, 0)} {t("home.jokiTersedia")}</span>
                        <span className="text-sm text-violet-400 group-hover:translate-x-1 transition-transform font-semibold">{t("home.mulai")}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))
          }
        </div>
      </section>

      {/* Recently viewed (only if user has viewed items) */}
      <RecentlyViewed />

      {/* WHY CHOOSE */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 border-t border-white/5">
        <div className="text-center mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest mb-2">{t("home.keunggulan")}</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient">{t("home.whyChoose")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: ShieldCheck, title: t("home.feature1Title"), desc: t("home.feature1Desc"), color: "#8b5cf6" },
            { icon: Zap, title: t("home.feature2Title"), desc: t("home.feature2Desc"), color: "#22d3ee" },
            { icon: Wallet, title: t("home.feature3Title"), desc: t("home.feature3Desc"), color: "#fbbf24" },
            { icon: Flame, title: t("home.feature4Title"), desc: t("home.feature4Desc"), color: "#f472b6" },
            { icon: Headphones, title: t("home.feature5Title"), desc: t("home.feature5Desc"), color: "#34d399" },
            { icon: Trophy, title: t("home.feature6Title"), desc: t("home.feature6Desc"), color: "#a78bfa" },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="card-lux p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ background: f.color + "15", color: f.color }}>
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">{f.title}</h3>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 border-t border-white/5">
        <div className="text-center mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest mb-2">{t("home.testimoni")}</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient">{t("home.testimonials")}</h2>
          <p className="mt-2 text-xs text-zinc-600">{t("home.testimonialsSub")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Real reviews from store pages */}
          <RealReviews />
          {/* Default testimonials (always visible) */}
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div className="card-lux p-5">
                <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className="size-3.5 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">&ldquo;{t.review}&rdquo;</p>
                <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-black" style={{ background: t.accent }}>{t.initials}</div>
                  <div><p className="text-sm font-medium text-zinc-100">{t.name}</p><p className="text-[10px] text-zinc-500">{t.game} · {t.item}</p></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden glass-strong rounded-3xl p-8 sm:p-12 text-center">
          <MovingGrid />
          <div className="relative">
            <h3 className="text-xl sm:text-2xl font-bold text-gradient">{t("home.ctaTitle")}</h3>
            <p className="mt-3 text-sm text-zinc-400 max-w-lg mx-auto">{t("home.ctaDesc")}</p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <PixelButton size="lg" onClick={scrollToGames}><Gamepad2 className="size-4" /> {t("home.ctaButton1")}</PixelButton>
              <PixelButton size="lg" variant="silver" asChild>
                <Link href="/contact"><ArrowRight className="size-4" /> {t("home.ctaButton2")}</Link>
              </PixelButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function GameCard({ game }: { game: Game }) { return null; }

function RealReviews() {
  const allReviews = useReviews((s) => s.reviews);
  const hydrated = useReviews((s) => s._hasHydrated);
  if (!hydrated || allReviews.length === 0) return null;
  return (
    <>
      {allReviews.slice(0, 6).map((r, i) => (
        <Reveal key={r.id} delay={i * 80}>
          <div className="card-lux p-5 border-violet-500/10">
            <div className="flex gap-0.5 mb-3">{Array.from({ length: r.rating }).map((_, s) => <Star key={s} className="size-3.5 fill-amber-400 text-amber-400" />)}</div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">&ldquo;{r.comment}&rdquo;</p>
            <div className="flex items-center gap-3 border-t border-white/5 pt-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                {r.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">{r.customerName}</p>
                <p className="text-[10px] text-zinc-500">{r.gameName} · Verified</p>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </>
  );
}
