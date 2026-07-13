"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Tag, Check, AlertTriangle, Lock, Star, X, Plus, Minus } from "lucide-react";
import type { Game } from "@/lib/games-data";
import type { ProductItem, ProductCategory } from "@/lib/games-data";
import { GAMES } from "@/lib/games-data";
import { useAkumaStore } from "@/lib/store";
import { useAdminStore } from "@/lib/admin-store";
import { useReviews } from "@/lib/reviews";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useCart, MAX_CART_ITEMS } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { PixelButton } from "./pixel-button";
import { Reveal } from "./reveal";
import { SkeletonGrid } from "./skeleton";
import { WishlistButton } from "./wishlist-button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function StoreView({ game }: { game: Game }) {
  const router = useRouter();
  const order = useAkumaStore((s) => s.order);
  const selectProduct = useAkumaStore((s) => s.selectProduct);
  const cartAdd = useCart((s) => s.add);
  const cartHas = useCart((s) => s.has);
  const cartCount = useCart((s) => s.items.length);
  const addViewed = useRecentlyViewed((s) => s.addViewed);
  const trackGameView = useAdminStore((s) => s.trackGameView);
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<{ item: ProductItem; category: string } | null>(null);
  const [cartLimitModal, setCartLimitModal] = useState(false);

  // Track game view on mount
  useEffect(() => {
    trackGameView(game.slug);
  }, [game.slug, trackGameView]);

  /* ===== Advanced Filter State ===== */
  const [filterQuery, setFilterQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default");

  // Collect all unique tags from items
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    game.categories.forEach((c) => c.items.forEach((i) => { if (i.tag) tags.add(i.tag); }));
    return Array.from(tags);
  }, [game]);

  // Filter + sort items
  const filteredCategories = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    let result = game.categories.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (filterCategory !== "all" && cat.id !== filterCategory) return false;
        if (filterTag !== "all" && item.tag !== filterTag) return false;
        if (q && !item.name.toLowerCase().includes(q) && !(item.description || "").toLowerCase().includes(q)) return false;
        return true;
      }),
    }));
    // Filter out empty categories when search/filter active
    if (q || filterTag !== "all") {
      result = result.filter((c) => c.items.length > 0);
    }
    // Sort items within each category
    if (sortBy !== "default") {
      result = result.map((c) => ({
        ...c,
        items: [...c.items].sort((a, b) => {
          if (sortBy === "price-asc") return a.price - b.price;
          if (sortBy === "price-desc") return b.price - a.price;
          if (sortBy === "name") return a.name.localeCompare(b.name);
          return 0;
        }),
      }));
    }
    // Hide categories not matching filterCategory
    if (filterCategory !== "all") {
      result = result.filter((c) => c.id === filterCategory);
    }
    return result;
  }, [game, filterQuery, filterCategory, filterTag, sortBy]);

  const handlePick = (
    item: (typeof game.categories)[number]["items"][number],
    categoryName: string
  ) => {
    const pItem = item as ProductItem;
    // Track ke recently viewed
    addViewed({
      id: `${game.slug}-${pItem.id}`,
      gameSlug: game.slug,
      gameName: game.name,
      gameEmoji: game.emoji,
      gameAccent: game.accent,
      productName: pItem.name,
      priceLabel: pItem.priceLabel,
    });
    setSelectedItem({ item: pItem, category: categoryName });
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    const success = cartAdd({
      id: `${game.slug}-${selectedItem.item.id}`,
      gameSlug: game.slug,
      gameName: game.name,
      gameEmoji: game.emoji,
      productId: selectedItem.item.id,
      productName: selectedItem.item.name,
      priceLabel: selectedItem.item.priceLabel,
      price: selectedItem.item.price,
      category: selectedItem.category,
    });
    if (!success) {
      // Cart full (5 items) or duplicate
      const isDuplicate = cartHas(`${game.slug}-${selectedItem.item.id}`);
      if (isDuplicate) {
        toast({ title: "Item sudah ada di keranjang", variant: "destructive" });
      } else {
        // Show limit modal
        setCartLimitModal(true);
      }
      return;
    }
    setSelectedItem(null);
    // Toast notification, NOT redirect
    toast({ title: "Ditambahkan ke keranjang! 🛒", description: `${selectedItem.item.name} (${selectedItem.item.priceLabel})` });
  };

  const handleBuyNow = () => {
    if (!selectedItem) return;
    selectProduct({
      gameSlug: game.slug,
      gameName: game.name,
      productId: selectedItem.item.id,
      productName: selectedItem.item.name,
      priceLabel: selectedItem.item.priceLabel,
      price: selectedItem.item.price,
      category: selectedItem.category,
    });
    setSelectedItem(null);
    router.push("/checkout");
  };

  const _handlePick = (
    item: (typeof game.categories)[number]["items"][number],
    categoryName: string
  ) => {
    selectProduct({
      gameSlug: game.slug,
      gameName: game.name,
      productId: item.id,
      productName: item.name,
      priceLabel: item.priceLabel,
      price: item.price,
      category: categoryName,
    });
    router.push("/checkout");
  };

  return (
    <div className="relative">
      {/* header band */}
      <section className="relative overflow-hidden border-b-2 border-[#a020f0]/40 scanlines">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div
          className="absolute -top-20 right-0 h-72 w-72 rounded-full blur-[100px]"
          style={{ background: `${game.accent}33` }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-pixel text-[9px] uppercase text-[#9a93a8] hover:text-[#c44bff] transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Beranda
          </Link>

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div
              className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center border-2 pixel-corner text-5xl sm:text-6xl"
              style={{
                background: "#121017",
                borderColor: game.accent,
                boxShadow: `0 0 22px ${game.accent}66`,
              }}
            >
              {game.emoji}
            </div>
            <div className="flex-1">
              <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-[#a020f0]">
                STORE
              </p>
              <h1 className="mt-2 font-pixel text-2xl sm:text-4xl text-[#e5e5e5] text-glow-neon">
                {game.name}
              </h1>
              <p className="mt-3 text-sm text-[#bcb4c9] max-w-xl">{game.description}</p>
            </div>
            <div className="hidden sm:block">
              <div className="border-2 border-[#a020f0]/50 pixel-corner bg-[#a020f0]/5 px-4 py-3 text-center">
                <p className="font-pixel text-[8px] uppercase text-[#9a93a8]">Total Joki</p>
                <p className="mt-1 font-pixel text-lg text-[#c44bff]">
                  {game.categories.reduce((a, c) => a + c.items.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notice banner (e.g. Blox Fruits CDK & SG warning) */}
      {game.notice && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
          <Reveal>
            <div
              className={`relative overflow-hidden border-2 pixel-corner p-5 sm:p-6 ${
                game.notice.type === "warning"
                  ? "border-[#ff3b6b]/60 bg-[#ff3b6b]/10"
                  : "border-[#7fd4ff]/50 bg-[#7fd4ff]/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border-2 pixel-corner ${
                    game.notice.type === "warning"
                      ? "border-[#ff3b6b] text-[#ff3b6b]"
                      : "border-[#7fd4ff] text-[#7fd4ff]"
                  }`}
                >
                  <AlertTriangle className="size-4" />
                </span>
                <div className="min-w-0">
                  <p
                    className={`font-pixel text-[10px] sm:text-xs uppercase ${
                      game.notice.type === "warning" ? "text-[#ff8aa3]" : "text-[#7fd4ff]"
                    }`}
                  >
                    {game.notice.title}
                  </p>
                  <p className="mt-2 text-sm text-[#e5e5e5] leading-relaxed">{game.notice.body}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      )}

      {/* Advanced Filter Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="glass-nav rounded-2xl p-4 sticky top-20 z-30">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Cari item... (mis. level, raid, senjata)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-500/40"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500/40"
            >
              <option value="all" className="bg-[#0a0a0a]">Semua Kategori</option>
              {game.categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0a]">{c.icon} {c.name}</option>
              ))}
            </select>
            {allTags.length > 0 && (
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500/40"
              >
                <option value="all" className="bg-[#0a0a0a]">Semua Tag</option>
                {allTags.map((t) => (
                  <option key={t} value={t} className="bg-[#0a0a0a]">{t}</option>
                ))}
              </select>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500/40"
            >
              <option value="default" className="bg-[#0a0a0a]">Urutkan: Default</option>
              <option value="price-asc" className="bg-[#0a0a0a]">Harga: Rendah → Tinggi</option>
              <option value="price-desc" className="bg-[#0a0a0a]">Harga: Tinggi → Rendah</option>
              <option value="name" className="bg-[#0a0a0a]">Nama (A-Z)</option>
            </select>
            {(filterQuery || filterCategory !== "all" || filterTag !== "all" || sortBy !== "default") && (
              <button
                onClick={() => { setFilterQuery(""); setFilterCategory("all"); setFilterTag("all"); setSortBy("default"); }}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all"
              >
                <X className="size-3.5" /> Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* category sections (filtered) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {filteredCategories.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-sm text-zinc-500">Tidak ada item yang cocok dengan filter.</p>
            <button
              onClick={() => { setFilterQuery(""); setFilterCategory("all"); setFilterTag("all"); setSortBy("default"); }}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-2 text-sm text-violet-400 hover:bg-violet-500/20 transition-all"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{cat.icon}</span>
              <h2 className="font-pixel text-sm sm:text-lg text-[#e5e5e5] text-glow-neon">
                {cat.name}
              </h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#a020f0] to-transparent" />
              <span className="font-pixel text-[8px] uppercase text-[#9a93a8]">
                {cat.items.length} item
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cat.items.map((item, i) => {
                const isSelected =
                  order?.gameSlug === game.slug && order?.productId === item.id;
                return (
                  <Reveal key={item.id} delay={i * 60}>
                    <ProductCard
                      item={item}
                      game={game}
                      selected={!!isSelected}
                      inCart={cartHas(`${game.slug}-${item.id}`)}
                      onPick={() => handlePick(item, cat.name)}
                    />
                  </Reveal>
                );
              })}
            </div>
          </div>
          ))
        )}
      </section>

      {/* Reviews section */}
      <StoreReviews game={game} />

      {/* other games */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="border-2 border-[#a020f0]/40 bg-[#121017]/60 pixel-corner p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="size-4 text-[#c44bff]" />
            <h3 className="font-pixel text-xs sm:text-sm text-[#e5e5e5] uppercase">
              Jelajahi Game Lain
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {GAMES.filter((g) => g.slug !== game.slug).map((g) => (
              <Link
                key={g.slug}
                href={`/store/${g.slug}`}
                className="flex items-center gap-3 border-2 border-[#2a2436] hover:border-[#a020f0] pixel-corner px-4 py-3 text-left transition-colors group"
              >
                <span className="text-2xl">{g.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[10px] text-[#e5e5e5] group-hover:text-[#c44bff] transition-colors truncate">
                    {g.name}
                  </p>
                  <p className="text-[10px] text-[#9a93a8] mt-1 truncate">{g.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-strong rounded-3xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-2xl" style={{ borderColor: game.accent, background: `${game.accent}15` }}>
                    {game.emoji}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">{selectedItem.item.name}</h3>
                    <p className="text-xs text-zinc-500">{game.name} · {selectedItem.category}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="size-5" />
                </button>
              </div>

              {/* Description */}
              {selectedItem.item.description && (
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">{selectedItem.item.description}</p>
              )}

              {/* Requirement */}
              {selectedItem.item.requirement && (
                <div className="flex items-center gap-2 mb-3 rounded-xl bg-amber-400/10 border border-amber-400/20 px-3 py-2">
                  <Lock className="size-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-400">{selectedItem.item.requirement}</span>
                </div>
              )}

              {/* Tag */}
              {selectedItem.item.tag && (
                <span className="inline-block mb-3 rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: `${game.accent}20`, color: game.accent }}>
                  {selectedItem.item.tag}
                </span>
              )}

              {/* Price */}
              <div className="flex items-end gap-1.5 mb-5">
                <span className="text-3xl font-bold text-gradient">{selectedItem.item.priceLabel}</span>
                <span className="text-xs text-zinc-500 mb-1">Robux</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={selectedItem ? cartHas(`${game.slug}-${selectedItem.item.id}`) : false}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    selectedItem && cartHas(`${game.slug}-${selectedItem.item.id}`)
                      ? "bg-green-500/15 border border-green-500/30 text-green-400 cursor-default"
                      : "bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10"
                  )}
                >
                  {selectedItem && cartHas(`${game.slug}-${selectedItem.item.id}`) ? (
                    <><Check className="size-4" /> Di Keranjang</>
                  ) : (
                    <><Plus className="size-4" /> Keranjang</>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3 text-sm font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all"
                >
                  <ShoppingCart className="size-4" /> Beli Sekarang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Badge */}
      {cartCount > 0 && (
        <Link href="/checkout" className="fixed bottom-6 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 shadow-[0_8px_24px_-4px_rgba(139,92,246,0.5)] hover:scale-105 transition-transform">
          <ShoppingCart className="size-6 text-white" />
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold border-2 border-[#07090f]">
            {cartCount}
          </span>
        </Link>
      )}

      {/* Cart Limit Modal */}
      <AnimatePresence>
        {cartLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartLimitModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-nav-strong rounded-3xl max-w-sm w-full p-6 text-center"
              style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
                <AlertTriangle className="size-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100 mb-1">Limit 5 Order Tercapai</h2>
              <p className="text-sm text-zinc-500 mb-5">
                Untuk sementara, maksimal {MAX_CART_ITEMS} joki per order. Hapus item dari keranjang untuk menambah yang baru, atau checkout sekarang.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/checkout"
                  onClick={() => setCartLimitModal(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all"
                >
                  <ShoppingCart className="size-4" /> Checkout Sekarang
                </Link>
                <button
                  onClick={() => setCartLimitModal(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({
  item,
  game,
  selected,
  onPick,
  inCart,
}: {
  item: {
    id: string;
    name: string;
    priceLabel: string;
    tag?: string;
    description?: string;
    requirement?: string;
  };
  game: Game;
  selected: boolean;
  onPick: () => void;
  inCart: boolean;
}) {
  // Promo tags yang dapat badge khusus (glowing + animasi)
  const PROMO_TAGS = ["hot", "popular", "legendary", "starter", "max", "pro", "full climb", "completionist", "quick fix"];
  const isPromo = item.tag && PROMO_TAGS.includes(item.tag.toLowerCase());
  const promoColor = isPromo
    ? item.tag?.toLowerCase() === "legendary"
      ? "#ffd166"
      : item.tag?.toLowerCase() === "hot"
      ? "#ff3b6b"
      : item.tag?.toLowerCase() === "popular"
      ? "#6ee7b7"
      : game.accent
    : game.accent;

  return (
    <div
      className={`group relative h-full akuma-card-hover border-2 bg-[#121017] pixel-corner overflow-hidden ${
        selected
          ? "border-[#6ee7b7] shadow-[0_0_26px_rgba(110,231,183,0.45)]"
          : "border-[#a020f0]/50 group-hover:border-[#a020f0] group-hover:shadow-[0_0_24px_rgba(160,32,240,0.45)]"
      }`}
    >
      {/* Promo ribbon (pojok kanan atas) untuk tag promo */}
      {isPromo && !selected && (
        <div
          className="absolute right-0 top-0 z-10 px-3 py-1 font-pixel text-[7px] uppercase text-[#0a0a0a]"
          style={{
            background: promoColor,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 15% 100%)",
            boxShadow: `0 0 12px ${promoColor}`,
          }}
        >
          PROMO
        </div>
      )}

      {/* top: price tag + status */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b-2 border-[#2a2436] bg-[#0a0a0a]/60">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-[#a020f0] shadow-[0_0_8px_#a020f0]" />
          <span className="font-pixel text-[8px] uppercase text-[#9a93a8]">Joki</span>
        </div>
        {selected ? (
          <span className="font-pixel text-[7px] uppercase px-2 py-1 bg-[#6ee7b7] text-[#0a0a0a] pixel-corner inline-flex items-center gap-1">
            <Check className="size-3" /> Dipilih
          </span>
        ) : item.tag ? (
          <span
            className={`font-pixel text-[7px] uppercase px-2 py-1 pixel-corner ${
              isPromo ? "animate-pulse" : ""
            }`}
            style={{
              background: isPromo ? `${promoColor}22` : game.accent,
              color: isPromo ? promoColor : "#0a0a0a",
              border: isPromo ? `1px solid ${promoColor}` : "none",
              boxShadow: isPromo ? `0 0 8px ${promoColor}66` : "none",
            }}
          >
            {item.tag}
          </span>
        ) : null}
      </div>

      {/* name + description */}
      <div className="flex-1 px-4 py-5">
        <h3 className="font-pixel text-xs sm:text-sm text-[#e5e5e5] leading-relaxed">{item.name}</h3>
        {item.description && (
          <p className="mt-2 text-[11px] sm:text-xs text-[#9a93a8] leading-relaxed">
            {item.description}
          </p>
        )}
        {/* Requirement badge (e.g. CDK / SG "Level 2300 - MAX") */}
        {item.requirement && (
          <div className="mt-3 inline-flex items-center gap-1.5 border border-[#ffd166]/50 bg-[#ffd166]/10 px-2 py-1 pixel-corner">
            <Lock className="size-3 text-[#ffd166]" />
            <span className="font-pixel text-[7px] uppercase text-[#ffd166]">
              {item.requirement}
            </span>
          </div>
        )}
        <div className="mt-4 flex items-end gap-1">
          <span className="font-pixel text-2xl sm:text-3xl text-[#c44bff] text-glow-neon">
            {item.priceLabel}
          </span>
          <span className="font-pixel text-[8px] text-[#9a93a8] uppercase mb-1">price</span>
        </div>
      </div>

      {/* action */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <button
          onClick={onPick}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-pixel uppercase tracking-wide transition-all active:scale-[0.97]",
            inCart
              ? "bg-green-500/15 border border-green-500/30 text-green-400"
              : "bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400"
          )}
        >
          {inCart ? (
            <>
              <Check className="size-3.5" /> Di Keranjang
            </>
          ) : (
            <>
              <ShoppingCart className="size-3.5" /> Pilih Joki
            </>
          )}
        </button>
        <WishlistButton
          gameSlug={game.slug}
          gameName={game.name}
          productId={item.id}
          productName={item.name}
          priceLabel={item.priceLabel}
          emoji={game.emoji}
          accent={game.accent}
        />
      </div>
    </div>
  );
}

/* ============================ Store Reviews ============================ */
function StoreReviews({ game }: { game: Game }) {
  const allReviews = useReviews((s) => s.reviews);
  const addReview = useReviews((s) => s.addReview);
  const hydrated = useReviews((s) => s._hasHydrated);
  const reviews = allReviews.filter((r) => r.gameSlug === game.slug);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    addReview({ gameSlug: game.slug, gameName: game.name, productName: game.name, customerName: name.trim(), rating, comment: comment.trim() });
    setName(""); setRating(5); setComment("");
  };

  if (!hydrated) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="flex items-center gap-2 mb-6">
        <Star className="size-5 text-amber-400" />
        <h2 className="text-lg font-bold text-zinc-100">Review & Rating</h2>
        {reviews.length > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-lg bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-xs text-amber-400">
            {avgRating.toFixed(1)} ★ · {reviews.length} review
          </span>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">Tulis Review</h3>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/40" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Rating:</span>
            {[1,2,3,4,5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                <Star className={cn("size-5", s <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-600")} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Bagikan pengalaman joki kamu..." rows={3} required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/40 resize-none" />
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all">
            Kirim Review
          </button>
        </form>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {reviews.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Star className="mx-auto size-8 text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-500">Belum ada review. Jadikan yang pertama!</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-200">{r.customerName}</span>
                  <div className="flex gap-0.5">{Array.from({length: 5}).map((_, i) => (
                    <Star key={i} className={cn("size-3", i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700")} />
                  ))}</div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{r.comment}</p>
                <p className="text-[10px] text-zinc-600 mt-2">{new Date(r.createdAt).toLocaleDateString("id-ID")}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
