"use client";

import { useAdminStore } from "@/lib/admin-store";
import { BarChart3, TrendingUp, Users, Package, Activity } from "lucide-react";

export default function LaporanPage() {
  const games = useAdminStore((s) => s.games);
  const orders = useAdminStore((s) => s.orders);
  const visitors = useAdminStore((s) => s.visitors);
  const activityLog = useAdminStore((s) => s.activityLog);

  const totalVisitors = visitors.reduce((a, v) => a + v.count, 0);
  const totalItems = games.reduce(
    (a, g) => a + g.categories.reduce((b, c) => b + c.items.length, 0),
    0
  );
  const newOrders = orders.filter((o) => o.status === "new").length;
  const doneOrders = orders.filter((o) => o.status === "done").length;

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
  const recentVisitors = visitors.slice(-14);
  const maxVisitor = Math.max(...recentVisitors.map((v) => v.count), 1);

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

      {/* visitor chart */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users className="size-4 text-[#7fd4ff]" />
          <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Visitor 14 Hari</h2>
        </div>
        {recentVisitors.length === 0 ? (
          <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-8">
            Belum ada data visitor
          </p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {recentVisitors.map((v) => {
              const h = (v.count / maxVisitor) * 100;
              return (
                <div key={v.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-gradient-to-t from-[#7fd4ff] to-[#a020f0] transition-all group-hover:opacity-80"
                    style={{ height: `${h}%`, minHeight: "4px" }}
                    title={`${v.date}: ${v.count} visitors`}
                  />
                  <span className="font-pixel text-[5px] text-[#5a5266] rotate-90 origin-center whitespace-nowrap">
                    {v.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* game popularity */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="size-4 text-[#c44bff]" />
          <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Popularitas Game (by items)</h2>
        </div>
        <div className="space-y-3">
          {gameStats.map((g) => (
            <div key={g.name} className="flex items-center gap-3">
              <span className="text-lg">{g.emoji}</span>
              <span className="text-sm text-[#e5e5e5] w-32 truncate">{g.name}</span>
              <div className="flex-1 h-4 bg-[#0a0a0a] border border-[#2a2436] pixel-corner overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(g.items / maxItems) * 100}%`,
                    background: g.accent,
                  }}
                />
              </div>
              <span className="font-pixel text-[7px] text-[#9a93a8] w-8 text-right">
                {g.items}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* activity log full */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="size-4 text-[#ffd166]" />
          <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">Activity Log (Audit Trail)</h2>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-2">
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
