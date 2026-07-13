"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { Package, Trash2, MessageCircle, CheckCircle2, Clock, XCircle, Copy, Check, Search } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/games-data";
import type { Order } from "@/lib/admin-store";
import { cn } from "@/lib/utils";

const STATUS_META: Record<Order["status"], { bg: string; text: string; border: string; icon: typeof Package; label: string }> = {
  new: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/40", icon: Clock, label: "Baru" },
  processing: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/40", icon: Package, label: "Processing" },
  done: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/40", icon: CheckCircle2, label: "Selesai" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/40", icon: XCircle, label: "Batal" },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PesananPage() {
  const orders = useAdminStore((s) => s.orders);
  const updateOrderStatus = useAdminStore((s) => s.updateOrderStatus);
  const deleteOrder = useAdminStore((s) => s.deleteOrder);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleStatus = (id: string, status: Order["status"]) => {
    updateOrderStatus(id, status);
    toast({ title: `✅ Status → ${STATUS_META[status].label}`, description: "Tersimpan & sync ke GitHub" });
  };

  const handleWA = (o: Order) => {
    const msg = `Halo! Update order ${o.orderId}\n\nGame: ${o.gameName}\nJoki: ${o.productName}\nUsername: ${o.username}\nStatus: ${STATUS_META[o.status].label}`;
    const a = document.createElement("a");
    a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyOrderId = (id: string) => {
    try { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch {}
  };

  const filtered = orders.filter(o =>
    !search ||
    (o.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
    o.productName.toLowerCase().includes(search.toLowerCase()) ||
    o.gameName.toLowerCase().includes(search.toLowerCase()) ||
    o.username.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: orders.length,
    processing: orders.filter(o => o.status === "processing").length,
    done: orders.filter(o => o.status === "done").length,
    new: orders.filter(o => o.status === "new").length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gradient">Pesanan</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {stats.total} total · {stats.new} baru · {stats.processing} processing · {stats.done} selesai
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari by Order ID, game, username..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/40"
        />
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Package className="mx-auto size-10 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">{orders.length === 0 ? "Belum ada pesanan masuk." : "Tidak ada hasil untuk pencarian ini."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const sm = STATUS_META[o.status];
            const StatusIcon = sm.icon;
            return (
              <div key={o.id} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Order ID + Status */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <button
                        onClick={() => copyOrderId(o.orderId || o.id.slice(0, 8).toUpperCase())}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 px-2.5 py-1 group"
                      >
                        <span className="font-mono text-xs font-bold text-violet-400 tracking-wider">{o.orderId || o.id.slice(0, 8).toUpperCase()}</span>
                        {copiedId === (o.orderId || o.id.slice(0, 8).toUpperCase())
                          ? <Check className="size-3 text-green-400" />
                          : <Copy className="size-3 text-zinc-600 group-hover:text-violet-400 transition-colors" />}
                      </button>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", sm.bg, sm.text)}>
                        <StatusIcon className="size-3" />
                        {sm.label}
                      </span>
                      <span className="text-[10px] text-zinc-600">{formatDate(o.createdAt)}</span>
                    </div>

                    {/* Order details */}
                    <p className="text-sm text-zinc-100">
                      <span className="text-violet-400 font-medium">{o.productName}</span> — {o.gameName}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>👤 <span className="text-zinc-300">{o.username}</span></span>
                      <span>🔒 <span className="text-zinc-300">{o.password}</span></span>
                      <span>💰 <span className="text-green-400">{o.priceLabel}</span></span>
                    </div>

                    {/* Quick status buttons */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleStatus(o.id, "processing")}
                        disabled={o.status === "processing"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all border",
                          o.status === "processing" ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30"
                        )}
                      >
                        <Package className="size-3" /> Processing
                      </button>
                      <button
                        onClick={() => handleStatus(o.id, "done")}
                        disabled={o.status === "done"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all border",
                          o.status === "done" ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30"
                        )}
                      >
                        <CheckCircle2 className="size-3" /> Selesai
                      </button>
                      <button
                        onClick={() => handleStatus(o.id, "cancelled")}
                        disabled={o.status === "cancelled"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all border",
                          o.status === "cancelled" ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        )}
                      >
                        <XCircle className="size-3" /> Batal
                      </button>
                      <button
                        onClick={() => handleWA(o)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all border bg-green-500/5 border-green-500/20 text-green-400 hover:bg-green-500/15"
                      >
                        <MessageCircle className="size-3" /> WA
                      </button>
                      <button
                        onClick={() => { if (confirm("Hapus pesanan ini?")) deleteOrder(o.id); }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all border bg-white/5 border-white/10 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                      >
                        <Trash2 className="size-3" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
