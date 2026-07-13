"use client";

import Link from "next/link";
import { Home, Gamepad2, RefreshCw } from "lucide-react";

/**
 * AkumaError — shared error page component untuk 404, 500, 403.
 * Tema pixel-art Akuma, glassmorphism, animated.
 */
export function AkumaError({
  code,
  title,
  description,
  showRefresh = false,
}: {
  code: string;
  title: string;
  description: string;
  showRefresh?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090f] px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.1), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md text-center">
        {/* Error code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6"
        >
          <h1 className="text-7xl sm:text-8xl font-bold text-gradient leading-none">
            {code}
          </h1>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">{title}</h2>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">{description}</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all"
          >
            <Home className="size-4" /> Ke Beranda
          </Link>
          <Link
            href="/store/blox-fruits"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-all"
          >
            <Gamepad2 className="size-4" /> Lihat Store
          </Link>
          {showRefresh && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-all"
            >
              <RefreshCw className="size-4" /> Reload
            </button>
          )}
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12"
        >
          <p className="font-pixel text-[8px] uppercase text-zinc-600 tracking-widest">AKUMA JOKI</p>
        </motion.div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
