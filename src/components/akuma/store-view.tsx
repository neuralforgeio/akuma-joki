"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Tag, Check, AlertTriangle, Lock, Star } from "lucide-react";
import type { Game } from "@/lib/games-data";
import { GAMES } from "@/lib/games-data";
import { useAkumaStore } from "@/lib/store";
import { useReviews } from "@/lib/reviews";
import { PixelButton } from "./pixel-button";
import { Reveal } from "./reveal";
import { SkeletonGrid } from "./skeleton";
import { WishlistButton } from "./wishlist-button";
import { cn } from "@/lib/utils";

export function StoreView({ game }: { game: Game }) {
  const router = useRouter();
  const order = useAkumaStore((s) => s.order);
  const selectProduct = useAkumaStore((s) => s.selectProduct);

  const handlePick = (
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

      {/* category sections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {game.categories.map((cat) => (
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
                      onPick={() => handlePick(item, cat.name)}
                    />
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}
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
    </div>
  );
}

function ProductCard({
  item,
  game,
  selected,
  onPick,
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
        <PixelButton
          variant={selected ? "silver" : "neon"}
          className="flex-1"
          onClick={onPick}
        >
          {selected ? (
            <>
              <Check className="size-3.5" /> Lanjut ke Checkout
            </>
          ) : (
            <>
              <ShoppingCart className="size-3.5" /> Pilih Joki
            </>
          )}
        </PixelButton>
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
  const reviews = useReviews((s) => s.reviews.filter((r) => r.gameSlug === game.slug));
  const addReview = useReviews((s) => s.addReview);
  const hydrated = useReviews((s) => s._hasHydrated);
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
