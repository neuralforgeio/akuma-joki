"use client";

import { useState, useMemo } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { Package, Trash2, MessageCircle, CheckCircle2, Clock, XCircle, Copy, Check, Search, ChevronDown, ChevronRight } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/games-data";
import type { Order } from "@/lib/admin-store";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/lib/confirm-modal";

const STATUS_META: Record<Order["status"], { bg: string; text: string; border: string; icon: typeof Package; label: string }> = {
  new: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/40", icon: Clock, label: "Baru" },
  processing: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/40", icon: Package, label: "Processing" },
  done: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/40", icon: CheckCircle2, label: "Selesai" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/40", icon: XCircle, label: "Batal" },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

type OrderGroup = {
  orderId: string;
  items: Order[];
  createdAt: number;
  username: string;
  overallStatus: Order["status"];
};

export default function PesananPage() {
  const orders = useAdminStore((s) => s.orders);
  const updateOrderStatus = useAdminStore((s) => s.updateOrderStatus);
  const deleteOrder = useAdminStore((s) => s.deleteOrder);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [modalGroup, setModalGroup] = useState<OrderGroup | null>(null);

  // Group orders by orderId
  const grouped: OrderGroup[] = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of orders) {
      const key = o.orderId || o.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    const groups: OrderGroup[] = [];
    for (const [orderId, items] of map) {
      const statuses = items.map(i => i.status);
      const allDone = statuses.every(s => s === "done");
      const allCancelled = statuses.every(s => s === "cancelled");
      const anyProcessing = statuses.some(s => s === "processing" || s === "new");
      const overall = allDone ? "done" : allCancelled ? "cancelled" : anyProcessing ? "processing" : "done";
      groups.push({
        orderId,
        items,
        createdAt: items[0].createdAt,
        username: items[0].username,
        overallStatus: overall as Order["status"],
      });
    }
    return groups.sort((a, b) => b.createdAt - a.createdAt);
  }, [orders]);

  // Filter groups by search
  const filtered = grouped.filter(g =>
    !search ||
    g.orderId.toLowerCase().includes(search.toLowerCase()) ||
    g.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase())) ||
    g.items.some(i => i.gameName.toLowerCase().includes(search.toLowerCase())) ||
    g.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatus = (id: string, status: Order["status"]) => {
    updateOrderStatus(id, status);
    toast({ title: `✅ Status → ${STATUS_META[status].label}`, description: "Tersimpan & sync ke GitHub" });
  };

  const handleBulkStatus = (group: OrderGroup, status: Order["status"]) => {
    group.items.forEach(item => updateOrderStatus(item.id, status));
    toast({ title: `✅ Semua ${group.items.length} item → ${STATUS_META[status].label}`, description: "Tersimpan & sync ke GitHub" });
    setModalGroup(null);
  };

  const handleWA = (group: OrderGroup) => {
    // Send to CUSTOMER's WhatsApp (if provided), not admin
    const customerWA = group.items[0]?.customerWA;
    if (!customerWA) {
      toast({ title: "Customer tidak punya nomor WA", description: "Minta customer untuk isi nomor WA saat checkout.", variant: "destructive" });
      return;
    }
    const msg = `Halo! Update order ${group.orderId}\n\nTotal Item: ${group.items.length}\n${group.items.map((i, idx) => `${idx + 1}. ${i.productName} (${i.gameName}) - ${i.status}`).join("\n")}`;
    const a = document.createElement("a");
    a.href = `https://wa.me/${customerWA}?text=${encodeURIComponent(msg)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Membuka WhatsApp customer...", description: `Ke: ${customerWA}` });
  };

  const copyOrderId = (id: string) => {
    try { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); toast({ title: "✅ Order ID tersalin!" }); } catch {}
  };

  const handleDelete = (group: OrderGroup) => {
    confirmAction({
      title: "Hapus Semua Item?",
      message: `Semua ${group.items.length} item dengan Order ID ${group.orderId} akan dihapus permanen.`,
      variant: "danger",
      confirmLabel: "Hapus Semua",
      onConfirm: () => {
        group.items.forEach(item => deleteOrder(item.id));
        toast({ title: "✅ Semua item dihapus" });
      },
    });
  };

  const stats = {
    total: grouped.length,
    processing: grouped.filter(g => g.overallStatus === "processing").length,
    done: grouped.filter(g => g.overallStatus === "done").length,
    items: orders.length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gradient">Pesanan</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {stats.total} order · {stats.items} item · {stats.processing} processing · {stats.done} selesai
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

      {/* Orders list — grouped by Order ID */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Package className="mx-auto size-10 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">{orders.length === 0 ? "Belum ada pesanan masuk." : "Tidak ada hasil untuk pencarian ini."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => {
            const sm = STATUS_META[group.overallStatus];
            const StatusIcon = sm.icon;
            const isExpanded = expandedGroup === group.orderId;
            return (
              <div key={group.orderId} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Order ID + Status */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <button
                        onClick={() => copyOrderId(group.orderId)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 px-2.5 py-1 group"
                      >
                        <span className="font-mono text-xs font-bold text-violet-400 tracking-wider">{group.orderId}</span>
                        {copiedId === group.orderId
                          ? <Check className="size-3 text-green-400" />
                          : <Copy className="size-3 text-zinc-600 group-hover:text-violet-400 transition-colors" />}
                      </button>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", sm.bg, sm.text)}>
                        <StatusIcon className="size-3" />
                        {sm.label}
                      </span>
                      <span className="text-[10px] text-zinc-600">{formatDate(group.createdAt)}</span>
                      <span className="text-[10px] text-violet-400 font-semibold">{group.items.length} item</span>
                    </div>

                    {/* Items summary (first 2) */}
                    <div className="space-y-0.5">
                      {group.items.slice(0, isExpanded ? undefined : 2).map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-600 shrink-0">#{idx + 1}</span>
                          <span className="text-zinc-300 truncate flex-1">{item.productName}</span>
                          <span className="text-zinc-600 hidden sm:inline">({item.gameName})</span>
                          <span className="text-green-400 shrink-0">{item.priceLabel}</span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full shrink-0",
                            item.status === "done" ? "bg-green-500/10 text-green-400" :
                            item.status === "processing" ? "bg-yellow-500/10 text-yellow-400" :
                            item.status === "cancelled" ? "bg-red-500/10 text-red-400" :
                            "bg-blue-500/10 text-blue-400")}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                      {!isExpanded && group.items.length > 2 && (
                        <button
                          onClick={() => setExpandedGroup(group.orderId)}
                          className="text-[10px] text-violet-400 hover:underline flex items-center gap-1"
                        >
                          <ChevronDown className="size-3" /> Lihat {group.items.length - 2} item lainnya
                        </button>
                      )}
                      {isExpanded && (
                        <button
                          onClick={() => setExpandedGroup(null)}
                          className="text-[10px] text-violet-400 hover:underline flex items-center gap-1"
                        >
                          <ChevronRight className="size-3" /> Sembunyikan
                        </button>
                      )}
                    </div>

                    {/* User info */}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>👤 <span className="text-zinc-300">{group.username}</span></span>
                      {group.items[0]?.customerWA && (
                        <span>📞 <span className="text-green-400">{group.items[0].customerWA}</span></span>
                      )}
                    </div>

                    {/* Quick action buttons */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setModalGroup(group)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
                      >
                        <Package className="size-3" /> Kelola Status
                      </button>
                      <button
                        onClick={() => handleBulkStatus(group, "done")}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all border bg-white/5 border-white/10 text-zinc-400 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30"
                      >
                        <CheckCircle2 className="size-3" /> Semua Selesai
                      </button>
                      <button
                        onClick={() => handleWA(group)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all border bg-green-500/5 border-green-500/20 text-green-400 hover:bg-green-500/15"
                      >
                        <MessageCircle className="size-3" /> WA
                      </button>
                      <button
                        onClick={() => handleDelete(group)}
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

      {/* Modal: Manage Status per item or bulk */}
      {modalGroup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setModalGroup(null)}
        >
          <div
            className="glass-nav-strong rounded-3xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto akuma-scroll"
            onClick={(e) => e.stopPropagation()}
            style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Kelola Status Order</h2>
                <p className="text-xs text-zinc-500 font-mono">{modalGroup.orderId} · {modalGroup.items.length} item</p>
              </div>
              <button onClick={() => setModalGroup(null)} className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">×</button>
            </div>

            {/* Bulk actions */}
            <div className="glass rounded-xl p-3 mb-3">
              <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-2">Ubah Semua Sekaligus</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleBulkStatus(modalGroup, "processing")}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                >
                  <Package className="size-3" /> Semua Processing
                </button>
                <button
                  onClick={() => handleBulkStatus(modalGroup, "done")}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                >
                  <CheckCircle2 className="size-3" /> Semua Selesai
                </button>
                <button
                  onClick={() => handleBulkStatus(modalGroup, "cancelled")}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                >
                  <XCircle className="size-3" /> Semua Batal
                </button>
              </div>
            </div>

            {/* Per-item status */}
            <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-2">Ubah Per Item</p>
            <div className="space-y-2">
              {modalGroup.items.map((item, idx) => {
                const ism = STATUS_META[item.status];
                return (
                  <div key={item.id} className="glass rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-zinc-600 shrink-0">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-100 truncate">{item.productName}</p>
                        <p className="text-[10px] text-zinc-500">{item.gameName} · {item.priceLabel}</p>
                      </div>
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full shrink-0", ism.bg, ism.text)}>
                        {ism.label}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleStatus(item.id, "processing")}
                        disabled={item.status === "processing"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium border transition-all",
                          item.status === "processing" ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-yellow-500/10 hover:text-yellow-400"
                        )}
                      >
                        <Package className="size-3" /> Processing
                      </button>
                      <button
                        onClick={() => handleStatus(item.id, "done")}
                        disabled={item.status === "done"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium border transition-all",
                          item.status === "done" ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-green-500/10 hover:text-green-400"
                        )}
                      >
                        <CheckCircle2 className="size-3" /> Selesai
                      </button>
                      <button
                        onClick={() => handleStatus(item.id, "cancelled")}
                        disabled={item.status === "cancelled"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium border transition-all",
                          item.status === "cancelled" ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                        )}
                      >
                        <XCircle className="size-3" /> Batal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setModalGroup(null)}
              className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
