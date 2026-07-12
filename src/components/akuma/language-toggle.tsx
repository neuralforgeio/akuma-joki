"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * LanguageToggle — dropdown untuk switch bahasa (ID / EN).
 * Pakai i18n store (persist localStorage).
 */
const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function LanguageToggle() {
  const lang = useI18n((s) => s.lang);
  const setLang = useI18n((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ganti bahasa"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-all"
      >
        <Globe className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 glass-nav-strong rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)] z-50 overflow-hidden border border-white/10">
          <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/8">
            Pilih Bahasa
          </p>
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors border-b border-white/5 last:border-0",
                lang === l.code ? "bg-violet-500/10 text-violet-400" : "text-zinc-300 hover:bg-white/5"
              )}
            >
              <span className="text-base">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {lang === l.code && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
