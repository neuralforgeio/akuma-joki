"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Clock, CheckCircle2, XCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { Reveal } from "@/components/akuma/reveal";
import { Starfield, MovingGrid } from "@/components/akuma/backgrounds";

type OrderStatus = "new" | "processing" | "done" | "cancelled";

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof Package; desc: string }> = {
  new: { label: "Baru", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", icon: Clock, desc: "Order diterima, menunggu konfirmasi admin" },
  processing: { label: "Diproses", color: "#22d3ee", bg: "rgba(34,211,238,0.1)", icon: Package, desc: "Joki sedang berjalan" },
  done: { label: "Selesai", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircle2, desc: "Order selesai! Selamat menikmati 🎉" },
  cancelled: { label: "Dibatalkan", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: XCircle, desc: "Order dibatalkan" },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function TrackOrderView() {
  const orders = useAdminStore((s) => s.orders);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [found, setFound] = useState<typeof orders[0] | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({ title: "Masukkan order ID", variant: "destructive" });
      return;
    }
    setSearched(true);
    const result = orders.find((o) => o.id.toLowerCase() === query.trim().toLowerCase());
    setFound(result || null);
    if (!result) {
      toast({ title: "Order tidak ditemukan", variant: "destructive" });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <Starfield />
      <MovingGrid />

      <section className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-12 sm:pt-20 pb-6 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full glass-nav px-4 py-1.5 mb-5">
            <Package className="size-3.5 text-violet-400" />
            <span className="text-[10px] sm:text-xs font-pixel uppercase tracking-widest text-violet-400">
              Track Order
            </span>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl leading-tight text-gradient">
            Lacak <span className="text-violet-400 ml-3">Order</span>
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-4 text-sm text-zinc-400 max-w-xl mx-auto">
            Masukkan Order ID yang kamu dapat setelah checkout untuk melacak status order.
          </p>
        </Reveal>
      </section>

      <section className="relative mx-auto max-w-2xl px-4 sm:px-6 pb-8">
        <Reveal>
          <form onSubmit={handleSearch} className="glass-nav-strong rounded-2xl p-5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Order ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="mis. m1abc23d"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 font-mono"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all"
              >
                <Search className="size-4" /> Lacak
              </button>
            </div>
            <p className="mt-2 text-[10px] text-zinc-600">
              Order ID diberikan admin setelah checkout via WhatsApp. Hubungi admin jika belum punya.
            </p>
          </form>
        </Reveal>
      </section>

      {/* Result */}
      <section className="relative mx-auto max-w-2xl px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {searched && found && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Order ID</p>
                    <p className="text-sm font-mono text-violet-400">{found.id}</p>
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ color: STATUS_META[found.status].color, backgroundColor: STATUS_META[found.status].bg }}
                  >
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_META[found.status].color }} />
                    {STATUS_META[found.status].label}
                  </div>
                </div>

                {/* Timeline */}
                <div className="my-6">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
                    {(["new", "processing", "done"] as OrderStatus[]).map((status, idx) => {
                      const isActive = found.status === status;
                      const isPast = ["new", "processing", "done"].indexOf(found.status) > idx;
                      const Icon = STATUS_META[status].icon;
                      return (
                        <div key={status} className="relative flex items-center gap-3 pb-5 last:pb-0">
                          <div
                            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${isActive || isPast ? "border-violet-500 bg-violet-500/20" : "border-white/10 bg-[#0a0a0a]"}`}
                            style={isActive ? { boxShadow: `0 0 12px ${STATUS_META[status].color}40` } : {}}
                          >
                            <Icon className="size-4" style={{ color: isActive || isPast ? STATUS_META[status].color : "#52525b" }} />
                          </div>
                          <div>
                            <p className={`text-sm ${isActive ? "text-zinc-100 font-semibold" : isPast ? "text-zinc-400" : "text-zinc-600"}`}>
                              {STATUS_META[status].label}
                            </p>
                            <p className="text-[10px] text-zinc-600">{STATUS_META[status].desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Game</p>
                    <p className="text-sm text-zinc-100">{found.gameName}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Produk</p>
                    <p className="text-sm text-zinc-100">{found.productName}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Harga</p>
                    <p className="text-sm text-violet-400 font-semibold">{found.priceLabel}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Tanggal</p>
                    <p className="text-xs text-zinc-400">{formatDate(found.createdAt)}</p>
                  </div>
                </div>

                {found.note && (
                  <div className="glass rounded-xl p-3 mb-4">
                    <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Catatan</p>
                    <p className="text-xs text-zinc-400">{found.note}</p>
                  </div>
                )}

                {found.status === "cancelled" && (
                  <div className="glass rounded-xl p-3 border-red-500/20 mb-4 flex items-start gap-2">
                    <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">Order ini telah dibatalkan. Hubungi admin untuk info lebih lanjut.</p>
                  </div>
                )}

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-violet-400 transition-colors"
                >
                  <ArrowLeft className="size-3.5" /> Ada masalah? Hubungi admin
                </Link>
              </div>
            </motion.div>
          )}

          {searched && !found && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="glass rounded-2xl p-8 text-center">
                <AlertCircle className="mx-auto size-10 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-400 mb-1">Order tidak ditemukan</p>
                <p className="text-[10px] text-zinc-600 mb-4">
                  Pastikan Order ID benar. Order ID case-sensitive.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-all"
                >
                  Hubungi Admin
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state hint */}
        {!searched && hydrated && orders.length === 0 && (
          <Reveal>
            <div className="glass rounded-2xl p-8 text-center">
              <Package className="mx-auto size-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-400 mb-1">Belum ada order</p>
              <p className="text-[10px] text-zinc-600 mb-4">
                Checkout dulu untuk dapat Order ID, lalu lacak di sini.
              </p>
              <Link
                href="/#games"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all"
              >
                Mulai Order →
              </Link>
            </div>
          </Reveal>
        )}
      </section>
    </div>
  );
}
