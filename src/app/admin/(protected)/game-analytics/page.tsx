"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { isDeveloper } from "@/lib/auth";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { HelpBanner } from "@/components/admin/help-tooltip";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Eye,
  EyeOff,
  TrendingUp,
  Trophy,
  CalendarDays,
  Activity,
} from "lucide-react";

type GameBreakdown = {
  slug: string;
  name: string;
  emoji: string;
  accent: string;
  totalViews: number;
  viewsToday: number;
  last7: { date: string; count: number }[];
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

function shortDate(s: string): string {
  // "MM-DD" (slice from YYYY-MM-DD)
  return s.slice(5);
}

export default function GameAnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);

  const games = useAdminStore((s) => s.games);
  const gameViews = useAdminStore((s) => s.gameViews);

  useEffect(() => {
    if (!isDeveloper()) {
      toast({
        title: "Akses ditolak: developer only",
        variant: "destructive",
      });
      router.replace("/admin");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthorized(true);
  }, [router, toast]);

  const today = todayStr();

  // Build last 7 days date list (oldest → newest)
  const last7Days = useMemo(
    () => [6, 5, 4, 3, 2, 1, 0].map((o) => dateStr(o)),
    []
  );

  // Aggregate stats
  const stats = useMemo(() => {
    const totalViews = gameViews.reduce((a, v) => a + v.count, 0);
    const viewsToday = gameViews
      .filter((v) => v.date === today)
      .reduce((a, v) => a + v.count, 0);

    // Per-game aggregation
    const bySlug = new Map<string, { total: number; today: number }>();
    for (const v of gameViews) {
      const cur = bySlug.get(v.slug) ?? { total: 0, today: 0 };
      cur.total += v.count;
      if (v.date === today) cur.today += v.count;
      bySlug.set(v.slug, cur);
    }

    // Most viewed game
    let mostViewedSlug = "";
    let mostViewedCount = 0;
    bySlug.forEach((val, slug) => {
      if (val.total > mostViewedCount) {
        mostViewedCount = val.total;
        mostViewedSlug = slug;
      }
    });

    const gamesTracked = bySlug.size;
    const avgPerGame = gamesTracked > 0 ? Math.round(totalViews / gamesTracked) : 0;

    return {
      totalViews,
      viewsToday,
      mostViewedSlug,
      mostViewedCount,
      avgPerGame,
      gamesTracked,
    };
  }, [gameViews, today]);

  // Build per-game breakdown (only games that have views)
  const breakdown: GameBreakdown[] = useMemo(() => {
    const result: GameBreakdown[] = [];
    const seenSlugs = new Set<string>();

    for (const g of games) {
      const entries = gameViews.filter((v) => v.slug === g.slug);
      if (entries.length === 0) continue;
      seenSlugs.add(g.slug);

      const totalViews = entries.reduce((a, v) => a + v.count, 0);
      const viewsToday = entries
        .filter((v) => v.date === today)
        .reduce((a, v) => a + v.count, 0);

      // last 7 days trend
      const last7 = last7Days.map((d) => ({
        date: d,
        count: entries.find((e) => e.date === d)?.count ?? 0,
      }));

      result.push({
        slug: g.slug,
        name: g.name,
        emoji: g.emoji,
        accent: g.accent,
        totalViews,
        viewsToday,
        last7,
      });
    }

    // Include slugs in gameViews but not in games list (deleted games) as "Unknown"
    for (const v of gameViews) {
      if (seenSlugs.has(v.slug)) continue;
      const existing = result.find((r) => r.slug === v.slug);
      if (existing) continue;
      const entries = gameViews.filter((e) => e.slug === v.slug);
      const totalViews = entries.reduce((a, e) => a + e.count, 0);
      const viewsToday = entries
        .filter((e) => e.date === today)
        .reduce((a, e) => a + e.count, 0);
      const last7 = last7Days.map((d) => ({
        date: d,
        count: entries.find((e) => e.date === d)?.count ?? 0,
      }));
      result.push({
        slug: v.slug,
        name: v.slug,
        emoji: "❓",
        accent: "#9a93a8",
        totalViews,
        viewsToday,
        last7,
      });
    }

    // Sort: most viewed first
    return result.sort((a, b) => b.totalViews - a.totalViews);
  }, [games, gameViews, today, last7Days]);

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-pixel text-[10px] uppercase text-[#a020f0] animate-pulse">
          Memuat...
        </p>
      </div>
    );
  }

  const max7 = Math.max(
    1,
    ...breakdown.flatMap((g) => g.last7.map((d) => d.count))
  );

  const mostViewedGame = games.find((g) => g.slug === stats.mostViewedSlug);

  return (
    <div className="space-y-5">
      <HelpBanner
        title="Game Analytics"
        description="Pantau statistik view per game. Data view tercatat otomatis setiap kali user membuka halaman game di website utama."
        tips={[
          "Stats grid menampilkan ringkasan: total views, views hari ini, game terpopuler, rata-rata views/game",
          "Last 7 days trend menampilkan bar chart mini per game (7 hari terakhir)",
          "Hanya game yang sudah pernah dilihat yang muncul di breakdown",
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon flex items-center gap-2">
            <BarChart3 className="size-4 text-[#c44bff]" />
            GAME ANALYTICS
          </h1>
          <p className="mt-1 text-sm text-[#9a93a8]">
            Statistik view per game & trend 7 hari terakhir.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={stats.totalViews}
          color="#7fd4ff"
        />
        <StatCard
          icon={CalendarDays}
          label="Views Today"
          value={stats.viewsToday}
          color="#6ee7b7"
        />
        <StatCard
          icon={Trophy}
          label="Most Viewed"
          value={stats.mostViewedCount}
          sub={
            mostViewedGame
              ? `${mostViewedGame.emoji} ${mostViewedGame.name}`
              : stats.mostViewedSlug || "—"
          }
          color="#ffd166"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg / Game"
          value={stats.avgPerGame}
          sub={`${stats.gamesTracked} games tracked`}
          color="#c44bff"
        />
      </div>

      {/* Per-game breakdown */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="size-4 text-[#c44bff]" />
          <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">
            Per-Game Breakdown
          </h2>
        </div>

        {breakdown.length === 0 ? (
          <div className="py-12 text-center">
            <EyeOff className="mx-auto size-8 text-[#5a5266]" />
            <p className="mt-3 font-pixel text-[7px] uppercase text-[#5a5266]">
              Belum ada data view
            </p>
            <p className="mt-1 text-xs text-[#9a93a8]">
              Data akan terisi otomatis saat user mengunjungi halaman game.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[32rem] overflow-y-auto akuma-scroll pr-1">
            {breakdown.map((g, idx) => (
              <div
                key={g.slug}
                className="border-2 border-[#2a2436] bg-[#0a0a0a] pixel-corner p-4 akuma-card-hover"
              >
                {/* Header row */}
                <div className="flex items-center gap-3">
                  <span
                    className="font-pixel text-[8px] text-[#9a93a8] w-5 text-center"
                    aria-label={`Rank ${idx + 1}`}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="text-xl"
                    style={{ filter: `drop-shadow(0 0 6px ${g.accent}66)` }}
                  >
                    {g.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#e5e5e5] truncate">
                      {g.name}
                    </p>
                    <p className="font-pixel text-[6px] uppercase text-[#5a5266] truncate">
                      {g.slug}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="font-pixel text-sm"
                      style={{ color: g.accent }}
                    >
                      {g.totalViews}
                    </p>
                    <p className="font-pixel text-[6px] uppercase text-[#9a93a8]">
                      total
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-pixel text-sm text-[#6ee7b7]">
                      {g.viewsToday}
                    </p>
                    <p className="font-pixel text-[6px] uppercase text-[#9a93a8]">
                      today
                    </p>
                  </div>
                </div>

                {/* 7-day trend bar chart */}
                <div className="mt-3 pl-8">
                  <div className="flex items-end gap-1 h-16">
                    {g.last7.map((d) => {
                      const h = d.count === 0 ? 4 : Math.max(8, (d.count / max7) * 60);
                      return (
                        <div
                          key={d.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative"
                          title={`${shortDate(d.date)}: ${d.count} views`}
                        >
                          <span className="absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity font-pixel text-[7px] text-[#e5e5e5] bg-[#1a1620] px-1.5 py-0.5 border border-[#2a2436] rounded">
                            {d.count}
                          </span>
                          <div
                            className="w-full rounded-t transition-all"
                            style={{
                              height: `${h}px`,
                              background: `linear-gradient(to top, ${g.accent}33, ${g.accent})`,
                              boxShadow:
                                d.count > 0
                                  ? `0 0 8px ${g.accent}66`
                                  : "none",
                            }}
                          />
                          <span className="mt-1 font-pixel text-[6px] uppercase text-[#5a5266]">
                            {shortDate(d.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="glass rounded-2xl p-4 border-violet-500/20">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/30">
            <BarChart3 className="size-3.5 text-violet-400" />
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Data view di-track per hari per game slug. Untuk reset atau modifikasi
            data mentah, gunakan{" "}
            <span className="text-violet-400 font-medium">Data Inspector</span> di
            menu developer tools.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className={cn(
        "border-2 bg-[#121017] pixel-corner p-4 akuma-card-hover"
      )}
      style={{ borderColor: `${color}40` }}
    >
      <span
        className="flex h-8 w-8 items-center justify-center border-2 pixel-corner"
        style={{ borderColor: color, color }}
      >
        <Icon className="size-4" />
      </span>
      <p className="mt-3 font-pixel text-2xl text-[#e5e5e5]">{value}</p>
      <p className="mt-1 font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">
        {label}
      </p>
      {sub && (
        <p
          className="mt-1 text-[10px] truncate"
          style={{ color: `${color}cc` }}
          title={sub}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
