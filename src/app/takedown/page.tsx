"use client";

import Image from "next/image";
// Static import — bundled at build, hot-reloaded in dev when config.json changes.
// Same source the middleware reads, so the page & redirect logic always agree.
import takedownConfig from "../../../config.json";

type TakedownConfig = {
  isTakedown: boolean;
  takedownReason: string;
};

const cfg = takedownConfig as TakedownConfig;
const REASON =
  cfg?.takedownReason ||
  "Website sedang dalam perbaikan sistem (Maintenance). Kami akan kembali secepatnya! - AKUMA JOKI";

export default function TakedownPage() {
  return (
    <main className="akuma-takedown relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 text-center">
      {/* GPU-friendly animated starfield + grid (pure CSS, translate3d) */}
      <div className="akuma-stars" aria-hidden />
      <div className="akuma-grid-bg" aria-hidden />
      <div className="akuma-vignette" aria-hidden />

      {/* Pulsing pixel-art lock */}
      <div className="relative z-10 mb-10">
        <div className="akuma-lock-glow" aria-hidden />
        <svg
          className="akuma-lock-pulse relative h-32 w-32 sm:h-40 sm:w-40"
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          fill="none"
          aria-label="Site locked"
        >
          {/* Shackle (top arc, pixel art) */}
          <g fill="#a020f0">
            <rect x="10" y="3" width="12" height="2" />
            <rect x="8" y="5" width="2" height="6" />
            <rect x="22" y="5" width="2" height="6" />
            <rect x="10" y="11" width="2" height="2" />
            <rect x="20" y="11" width="2" height="2" />
          </g>
          {/* Body */}
          <g fill="#e5e5e5">
            <rect x="6" y="13" width="20" height="2" />
            <rect x="4" y="15" width="2" height="12" />
            <rect x="26" y="15" width="2" height="12" />
            <rect x="6" y="27" width="20" height="2" />
          </g>
          {/* Keyhole */}
          <g fill="#0a0a0a">
            <rect x="14" y="17" width="4" height="2" />
            <rect x="13" y="19" width="6" height="2" />
            <rect x="14" y="21" width="4" height="4" />
          </g>
          {/* Neon outline accents */}
          <g fill="#c44bff" opacity="0.9">
            <rect x="6" y="13" width="2" height="2" />
            <rect x="24" y="13" width="2" height="2" />
            <rect x="4" y="25" width="2" height="2" />
            <rect x="26" y="25" width="2" height="2" />
          </g>
        </svg>
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 h-14 w-28 sm:h-16 sm:w-32 logo-glow rounded-sm overflow-hidden">
        <Image
          src="/akuma-logo.png"
          alt="AKUMA JOKI"
          fill
          sizes="(min-width: 640px) 128px, 112px"
          className="object-contain"
        />
      </div>

      {/* Status tag */}
      <div className="relative z-10 mb-6 inline-flex items-center gap-2 border-2 border-[#ff3b6b]/60 bg-[#ff3b6b]/10 px-4 py-2 pixel-corner">
        <span className="h-2 w-2 bg-[#ff3b6b] shadow-[0_0_8px_#ff3b6b] animate-pulse" />
        <span className="font-pixel text-[8px] sm:text-[9px] uppercase tracking-widest text-[#ff8aa3]">
          System Under Maintenance
        </span>
      </div>

      {/* Title */}
      <h1 className="relative z-10 font-pixel text-2xl sm:text-4xl text-[#e5e5e5] text-glow-neon leading-tight">
        AKUMA <span className="text-[#a020f0]">JOKI</span>
      </h1>

      {/* Reason */}
      <p className="relative z-10 mt-6 max-w-md text-sm sm:text-base text-[#bcb4c9] leading-relaxed">
        {REASON}
      </p>

      {/* Blinking caret line */}
      <p className="relative z-10 mt-8 font-pixel text-[10px] text-[#a020f0]">
        &gt; REBOOTING<span className="blink">_</span>
      </p>
    </main>
  );
}
