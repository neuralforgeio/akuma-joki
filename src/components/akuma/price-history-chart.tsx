"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * PriceHistoryChart — mini sparkline SVG showing mock 30-day price history.
 * Pure frontend; data generated via deterministic random walk from current price.
 *
 * Mounted inside the store-view item modal (Feature 4).
 */
export function PriceHistoryChart({
  currentPrice,
  priceLabel,
  accent = "#a020f0",
}: {
  currentPrice?: number;
  priceLabel: string;
  accent?: string;
}) {
  const t = useI18n((s) => s.t);
  // Subscribe to lang so this component re-renders when language changes
  useI18n((s) => s.lang);

  // Generate 30 days of mock price history (deterministic random walk)
  const { points, min, max } = useMemo(() => {
    const base = currentPrice ?? (parseInt(priceLabel.replace(/\D/g, ""), 10) || 10);
    const days = 30;
    // Deterministic pseudo-random walk so chart is stable across renders
    let seed = base * 1000 + 7;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const pts: number[] = [];
    let p = base * 1.1; // start slightly above current
    for (let i = 0; i < days; i++) {
      const drift = (rng() - 0.5) * base * 0.18;
      p = Math.max(base * 0.6, p + drift);
      pts.push(p);
    }
    // Pin last point to current price
    pts[days - 1] = base;

    const mn = Math.min(...pts);
    const mx = Math.max(...pts);
    return { points: pts, min: mn, max: mx };
  }, [currentPrice, priceLabel]);

  // Build SVG path
  const W = 240;
  const H = 56;
  const pad = 4;
  const range = Math.max(max - min, 0.001);
  const stepX = (W - pad * 2) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (H - pad * 2) * (1 - (p - min) / range);
    return [x, y];
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L ${(W - pad).toFixed(2)} ${H - pad} L ${pad} ${H - pad} Z`;

  const last = points[points.length - 1];
  const first = points[0];
  const trendUp = last >= first;

  return (
    <div className="mb-5 rounded-2xl bg-white/3 border border-white/8 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">📊</span>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {t("priceHistory.title")}
          </p>
          <span className="text-[9px] text-zinc-600">· {t("priceHistory.subtitle")}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px]">
          <span
            className="px-1.5 py-0.5 rounded font-semibold"
            style={{
              background: trendUp ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              color: trendUp ? "#f87171" : "#22c55e",
            }}
          >
            {trendUp ? "▲" : "▼"} {Math.abs(((last - first) / first) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
        <defs>
          <linearGradient id="phc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#phc-grad)" />
        <path d={linePath} fill="none" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Current price dot */}
        {coords.length > 0 && (
          <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.5" fill={accent} />
        )}
      </svg>

      <div className="mt-1 flex items-center justify-between text-[9px] text-zinc-500">
        <span>{t("priceHistory.lowest")}: {Math.round(min)}K</span>
        <span className="text-zinc-400 font-semibold">{t("priceHistory.current")}: {priceLabel}</span>
        <span>{t("priceHistory.highest")}: {Math.round(max)}K</span>
      </div>
    </div>
  );
}
