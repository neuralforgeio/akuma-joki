"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HelpTooltip — inline help tooltip untuk dashboard admin.
 * Posisi: di sebelah label/heading, klik untuk show/hide panduan.
 *
 * Usage:
 * <HelpTooltip title="Cara tambah game" steps={["1. Isi nama", "2. Pilih emoji", ...]} />
 */
export function HelpTooltip({
  title,
  steps,
  example,
  className,
}: {
  title: string;
  steps: string[];
  example?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Bantuan: ${title}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
      >
        <HelpCircle className="size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 w-72 glass-strong rounded-2xl p-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-violet-400">{title}</h4>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300 shrink-0">
                <X className="size-3.5" />
              </button>
            </div>
            <ol className="space-y-1.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-zinc-400 leading-relaxed">
                  <span className="shrink-0 h-4 w-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[9px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {example && (
              <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-2.5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Contoh:</p>
                <p className="text-xs text-zinc-300">{example}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * HelpBanner — banner panduan yang bisa di-dismiss, untuk top of page.
 * Menampilkan ringkasan cara menggunakan halaman dashboard tersebut.
 */
export function HelpBanner({
  title,
  description,
  tips,
}: {
  title: string;
  description: string;
  tips?: string[];
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="glass rounded-2xl p-4 mb-4 border-violet-500/20">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30">
          <HelpCircle className="size-4 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>
          {tips && tips.length > 0 && (
            <ul className="mt-2 space-y-1">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-500">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Tutup panduan"
          className="shrink-0 text-zinc-500 hover:text-zinc-300"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
