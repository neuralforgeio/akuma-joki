"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DEFAULT_ABOUT } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { Reveal } from "./reveal";
import { Starfield, MovingGrid } from "./backgrounds";

export function AboutView() {
  const adminAbout = useAdminStore((s) => s.about);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const about = hydrated && adminAbout ? adminAbout : DEFAULT_ABOUT;

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <Starfield />
      <MovingGrid />

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-12 sm:pt-20 pb-10 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-5">
            <Sparkles className="size-3.5 text-violet-400" />
            <span className="text-[10px] sm:text-xs font-pixel uppercase tracking-widest text-violet-400">
              About Us
            </span>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl leading-tight text-gradient">
            {about.title.replace("Tentang ", "").split(" ").map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className={i === 1 ? "text-violet-400 ml-3" : ""}
              >
                {w}{" "}
              </motion.span>
            ))}
          </h1>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-5 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            {about.tagline}
          </p>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {about.stats.map((s, i) => (
            <Reveal key={s.id} delay={i * 80}>
              <div className="glass rounded-2xl p-4 sm:p-5 text-center hover:border-violet-500/20 transition-colors">
                <p className="text-2xl sm:text-3xl font-bold text-gradient">{s.value}</p>
                <p className="mt-1 text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="relative mx-auto max-w-3xl px-4 sm:px-6 pb-12">
        <Reveal>
          <div className="glass-strong rounded-3xl p-6 sm:p-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-1 bg-gradient-to-b from-violet-500 to-violet-400 rounded-full" />
              <h2 className="text-xs font-pixel uppercase tracking-widest text-violet-400">Siapa Kami</h2>
            </div>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {about.description}
            </p>
          </div>
        </Reveal>
      </section>

      {/* Mission */}
      <section className="relative mx-auto max-w-3xl px-4 sm:px-6 pb-12">
        <Reveal>
          <div className="glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30">
                <Target className="size-5 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">Misi Kami</h2>
            </div>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              {about.mission}
            </p>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 pb-12">
        <Reveal>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-gradient mb-8">KENAPA PILIH AKUMA JOKI?</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-4">
          {about.features.map((f, i) => (
            <Reveal key={f.id} delay={i * 80}>
              <div className="group glass rounded-2xl p-5 hover:border-violet-500/30 transition-all hover:-translate-y-0.5 h-full">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 border border-violet-500/20 text-2xl group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1">{f.title}</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden glass-strong rounded-3xl p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="relative">
              <ShieldCheck className="mx-auto size-10 text-violet-400 mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-2">
                Siap Mulai Joki?
              </h2>
              <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
                Pilih game favoritmu, lihat item yang tersedia, dan rasakan layanan joki terbaik dari AKUMA JOKI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/#games"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all shadow-[0_4px_20px_-4px_rgba(139,92,246,0.5)]"
                >
                  Lihat Game <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm text-zinc-300 hover:bg-white/10 transition-all"
                >
                  Hubungi Kami
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
