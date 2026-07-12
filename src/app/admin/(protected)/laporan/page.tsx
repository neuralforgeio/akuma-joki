"use client";

import { useAdminStore } from "@/lib/admin-store";
import { BarChart3, TrendingUp, Users, Package, Activity, Star, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

export default function LaporanPage() {
  const games = useAdminStore((s) => s.games);
  const orders = useAdminStore((s) => s.orders);
  const visitors = useAdminStore((s) => s.visitors);
  const activityLog = useAdminStore((s) => s.activityLog);
  const reviews = useAdminStore((s) => s.reviews);

  const totalVisitors = visitors.reduce((a, v) => a + v.count, 0);
  const totalItems = games.reduce(
    (a, g) => a + g.categories.reduce((b, c) => b + c.items.length, 0),
    0
  );
  const newOrders = orders.filter((o) => o.status === "new").length;
  const doneOrders = orders.filter((o) => o.status === "done").length;
  const processingOrders = orders.filter((o) => o.status === "processing").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

  // game popularity (items count)
  const gameStats = games
    .map((g) => ({
      name: g.name,
      emoji: g.emoji,
      accent: g.accent,
      items: g.categories.reduce((a, c) => a + c.items.length, 0),
    }))
    .sort((a, b) => b.items - a.items);

  const maxItems = Math.max(...gameStats.map((g) => g.items), 1);

  // visitor chart data (last 14 days)
  const recentVisitors = visitors.slice(-14).map((v) => ({
    date: v.date.slice(5),
    visitors: v.count,
  }));
  const maxVisitor = Math.max(...recentVisitors.map((v) => v.visitors), 1);

  // Order status distribution (pie chart)
  const orderStatusData = [
    { name: "Baru", value: newOrders, color: "#fbbf24" },
    { name: "Diproses", value: processingOrders, color: "#22d3ee" },
    { name: "Selesai", value: doneOrders, color: "#10b981" },
    { name: "Batal", value: cancelledOrders, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Review rating distribution (bar chart)
  const ratingData = [1, 2, 3, 4, 5].map((star) => ({
    star: `${star}★`,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  // Top games by reviews
  const gameReviewStats = games
    .map((g) => {
      const gReviews = reviews.filter((r) => r.gameSlug === g.slug);
      const avg = gReviews.length > 0 ? gReviews.reduce((a, r) => a + r.rating, 0) / gReviews.length : 0;
      return { name: g.name, emoji: g.emoji, accent: g.accent, reviews: gReviews.length, avg: Number(avg.toFixed(1)) };
    })
    .filter((g) => g.reviews > 0)
    .sort((a, b) => b.reviews - a.reviews);

  // Revenue estimate (sum of priceLabels parsed — best effort)
  const revenueEstimate = orders
    .filter((o) => o.status === "done")
    .reduce((sum, o) => {
      const m = o.priceLabel?.match(/(\d+(?:\.\d+)?)/);
      return sum + (m ? parseFloat(m[1]) : 0);
    }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          LAPORAN
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">
          Statistik & analytics website.
        </p>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Visitors" value={totalVisitors} color="#7fd4ff" />
        <StatCard icon={Package} label="Total Orders" value={orders.length} color="#ffd166" />
        <StatCard icon={TrendingUp} label="New Orders" value={newOrders} color="#ff6ad5" />
        <StatCard icon={BarChart3} label="Done Orders" value={doneOrders} color="#6ee7b7" />
      </div>

      {/* secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Star} label="Total Reviews" value={reviews.length} color="#fbbf24" />
        <StatCard icon={DollarSign} label="Revenue Est. (K)" value={revenueEstimate} color="#10b981" />
        <StatCard icon={Package} label="Total Items" value={totalItems} color="#a78bfa" />
        <StatCard icon={BarChart3} label="Active Games" value={games.length} color="#22d3ee" />
      </div>

      {/* visitor line chart (recharts) */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users className="size-4 text-[#7fd4ff]" />
          <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Visitor Trend (14 Hari)</h2>
        </div>
        {recentVisitors.length === 0 ? (
          <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-8">
            Belum ada data visitor
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={recentVisitors} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2436" />
              <XAxis dataKey="date" tick={{ fill: "#9a93a8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9a93a8", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#0a0a0a", border: "1px solid #2a2436", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#e5e5e5" }}
              />
              <Line type="monotone" dataKey="visitors" stroke="#7fd4ff" strokeWidth={2} dot={{ fill: "#a020f0", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two-column: Order status pie + Rating distribution bar */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Order status pie */}
        <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package className="size-4 text-[#ffd166]" />
            <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Distribusi Status Order</h2>
          </div>
          {orderStatusData.length === 0 ? (
            <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-12">Belum ada order</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => `${e.name}: ${e.value}`}>
                  {orderStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #2a2436", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#9a93a8" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rating distribution bar */}
        <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
          <div className="mb-4 flex items-center gap-2">
            <Star className="size-4 text-[#fbbf24]" />
            <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Distribusi Rating Review</h2>
          </div>
          {reviews.length === 0 ? (
            <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-12">Belum ada review</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ratingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2436" />
                <XAxis dataKey="star" tick={{ fill: "#9a93a8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9a93a8", fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #2a2436", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* game popularity (bar chart recharts) */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="size-4 text-[#c44bff]" />
          <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Popularitas Game (by items)</h2>
        </div>
        {gameStats.length === 0 ? (
          <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-8">Belum ada game</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(150, gameStats.length * 50)}>
            <BarChart data={gameStats} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2436" />
              <XAxis type="number" tick={{ fill: "#9a93a8", fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9a93a8", fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #2a2436", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="items" radius={[0, 4, 4, 0]}>
                {gameStats.map((g, i) => <Cell key={i} fill={g.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top games by reviews */}
      {gameReviewStats.length > 0 && (
        <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
          <div className="mb-4 flex items-center gap-2">
            <Star className="size-4 text-[#fbbf24]" />
            <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Top Game by Reviews</h2>
          </div>
          <div className="space-y-2">
            {gameReviewStats.slice(0, 5).map((g, i) => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="font-pixel text-[8px] text-[#9a93a8] w-4">{i + 1}</span>
                <span className="text-lg">{g.emoji}</span>
                <span className="text-sm text-[#e5e5e5] flex-1 truncate">{g.name}</span>
                <div className="flex items-center gap-1">
                  <Star className="size-3 fill-[#fbbf24] text-[#fbbf24]" />
                  <span className="text-xs text-[#fbbf24] font-semibold">{g.avg}</span>
                </div>
                <span className="font-pixel text-[7px] text-[#9a93a8] w-12 text-right">{g.reviews} review</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* activity log full */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="size-4 text-[#ffd166]" />
          <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Activity Log (Audit Trail)</h2>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-2 akuma-scroll">
          {activityLog.length === 0 ? (
            <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-8">
              Belum ada aktivitas
            </p>
          ) : (
            activityLog.map((a) => (
              <div key={a.id} className="flex items-start gap-3 border-l-2 border-[#a020f0]/40 pl-3 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[7px] uppercase text-[#c44bff]">{a.action}</p>
                  <p className="text-xs text-[#bcb4c9] truncate">{a.detail}</p>
                </div>
                <span className="font-pixel text-[6px] text-[#5a5266] shrink-0">
                  {new Date(a.timestamp).toLocaleString("id-ID")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4 akuma-card-hover">
      <span
        className="flex h-8 w-8 items-center justify-center border-2 pixel-corner"
        style={{ borderColor: color, color }}
      >
        <Icon className="size-4" />
      </span>
      <p className="mt-3 font-pixel text-2xl text-[#e5e5e5]">{value}</p>
      <p className="mt-1 font-pixel text-[7px] uppercase tracking-wide text-[#9a93a8]">{label}</p>
    </div>
  );
}
