"use client";
import { HelpBanner } from "@/components/admin/help-tooltip";

import Link from "next/link";
import { useAdminStore, useTotalItems } from "@/lib/admin-store";
import { useReviews } from "@/lib/reviews";
import { useI18n } from "@/lib/i18n";
import { PixelButton } from "@/components/akuma/pixel-button";
import {
  Gamepad2,
  Package,
  Megaphone,
  Power,
  TrendingUp,
  Users,
  GitCommit,
  Activity,
  Zap,
} from "lucide-react";

export default function AdminDashboard() {
  const games = useAdminStore((s) => s.games);
  const orders = useAdminStore((s) => s.orders);
  const announcement = useAdminStore((s) => s.announcement);
  const takedown = useAdminStore((s) => s.takedown);
  const visitors = useAdminStore((s) => s.visitors);
  const commits = useAdminStore((s) => s.commits);
  const activityLog = useAdminStore((s) => s.activityLog);
  const totalItems = useTotalItems();
  const totalReviews = useReviews((s) => s.reviews.length);
  const t = useI18n((s) => s.t);
  // Subscribe to lang so this component re-renders when language changes
  // (the t function reference is stable and won't trigger re-render by itself)
  useI18n((s) => s.lang);

  const totalVisitors = visitors.reduce((a, v) => a + v.count, 0);
  const newOrders = orders.filter((o) => o.status === "new").length;
  // Suppress unused warnings — these are still useful for future enhancements
  void totalItems;
  void newOrders;

  const stats = [
    { label: t("dash.totalGames"), value: games.length, icon: Gamepad2, color: "#a020f0" },
    { label: t("dash.totalOrders"), value: orders.length, icon: Package, color: "#25D366" },
    { label: t("dash.totalReviews"), value: totalReviews, icon: Package, color: "#ffd166" },
    { label: t("dash.totalVisitors"), value: totalVisitors, icon: Users, color: "#7fd4ff" },
  ];

  return (
    <div className="space-y-6">
      <HelpBanner title="Dashboard" description="Ringkasan statistik dan aktivitas website AKUMA JOKI." tips={["Lihat total games, items, pesanan, visitors", "Quick actions untuk akses cepat ke fitur utama", "Activity log menampilkan semua aksi admin", "Visitor chart 7 hari terakhir"]} />
      {/* header */}
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          {t("dash.title").toUpperCase()}
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">
          {t("dash.welcome")}, admin AKUMA JOKI.
        </p>
      </div>

      {/* status badges */}
      <div className="flex flex-wrap gap-3">
        <div
          className={`flex items-center gap-2 border-2 pixel-corner px-3 py-2 ${
            takedown
              ? "border-[#ff3b6b] bg-[#ff3b6b]/10"
              : "border-[#6ee7b7] bg-[#6ee7b7]/10"
          }`}
        >
          <Power className={`size-3.5 ${takedown ? "text-[#ff3b6b]" : "text-[#6ee7b7]"}`} />
          <span className={`font-pixel text-[8px] uppercase ${takedown ? "text-[#ff3b6b]" : "text-[#6ee7b7]"}`}>
            {takedown ? "Takedown ON" : "Website Live"}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 border-2 pixel-corner px-3 py-2 ${
            announcement?.active
              ? "border-[#ffd166] bg-[#ffd166]/10"
              : "border-[#2a2436] bg-[#121017]"
          }`}
        >
          <Megaphone className={`size-3.5 ${announcement?.active ? "text-[#ffd166]" : "text-[#9a93a8]"}`} />
          <span className={`font-pixel text-[8px] uppercase ${announcement?.active ? "text-[#ffd166]" : "text-[#9a93a8]"}`}>
            {announcement?.active ? "Announcement Active" : "No Announcement"}
          </span>
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4 akuma-card-hover"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-8 w-8 items-center justify-center border-2 pixel-corner"
                  style={{ borderColor: s.color, color: s.color }}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 font-pixel text-2xl text-[#e5e5e5]">{s.value}</p>
              <p className="mt-1 font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* quick actions */}
      <div>
        <h2 className="mb-3 font-pixel text-[10px] uppercase tracking-wide text-[#c44bff]">
          {t("dash.quickActions")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <PixelButton size="sm" asChild>
            <Link href="/admin/games">
              <Gamepad2 className="size-3.5" /> {t("dash.manageGames")}
            </Link>
          </PixelButton>
          <PixelButton size="sm" variant="silver" asChild>
            <Link href="/admin/announcement">
              <Megaphone className="size-3.5" /> Announcement
            </Link>
          </PixelButton>
          <PixelButton size="sm" variant="silver" asChild>
            <Link href="/admin/takedown">
              <Power className="size-3.5" /> Takedown
            </Link>
          </PixelButton>
          <PixelButton size="sm" variant="silver" asChild>
            <Link href="/admin/commit">
              <GitCommit className="size-3.5" /> Commit
            </Link>
          </PixelButton>
        </div>
      </div>

      {/* recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="size-4 text-[#c44bff]" />
            <h3 className="font-pixel text-[9px] uppercase tracking-wide text-[#e5e5e5]">
              {t("dash.recentActivity")}
            </h3>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {activityLog.length === 0 ? (
              <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-4">
                {t("dash.noActivity")}
              </p>
            ) : (
              activityLog.slice(0, 10).map((a) => (
                <div key={a.id} className="border-l-2 border-[#a020f0]/40 pl-3 py-1">
                  <p className="font-pixel text-[7px] uppercase text-[#c44bff]">
                    {a.action}
                  </p>
                  <p className="text-xs text-[#bcb4c9] truncate">{a.detail}</p>
                  <p className="font-pixel text-[6px] text-[#5a5266] mt-0.5">
                    {new Date(a.timestamp).toLocaleString("id-ID")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-[#25D366]" />
            <h3 className="font-pixel text-[9px] uppercase tracking-wide text-[#e5e5e5]">
              Visitor 7 Hari
            </h3>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {visitors.length === 0 ? (
              <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-4">
                Belum ada data visitor
              </p>
            ) : (
              visitors
                .slice(-7)
                .reverse()
                .map((v) => {
                  const maxCount = Math.max(...visitors.map((x) => x.count), 1);
                  const pct = (v.count / maxCount) * 100;
                  return (
                    <div key={v.date} className="flex items-center gap-2">
                      <span className="font-pixel text-[7px] text-[#9a93a8] w-20">
                        {v.date.slice(5)}
                      </span>
                      <div className="flex-1 h-3 bg-[#0a0a0a] border border-[#2a2436] pixel-corner overflow-hidden">
                        <div
                          className="h-full bg-[#25D366] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-pixel text-[7px] text-[#6ee7b7] w-8 text-right">
                        {v.count}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* latest commits */}
      {commits.length > 0 && (
        <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="size-4 text-[#ffd166]" />
            <h3 className="font-pixel text-[9px] uppercase tracking-wide text-[#e5e5e5]">
              Commit Terbaru
            </h3>
          </div>
    <div className="space-y-2">
            {commits.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center gap-3 border-l-2 border-[#ffd166]/40 pl-3">
                <GitCommit className="size-3 text-[#ffd166]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#e5e5e5] truncate">{c.message}</p>
                  <p className="font-pixel text-[6px] text-[#5a5266]">
                    {c.author} · {new Date(c.timestamp).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
