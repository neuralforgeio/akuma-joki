"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Tag, Check, AlertTriangle, Lock } from "lucide-react";
import type { Game } from "@/lib/games-data";
import { GAMES } from "@/lib/games-data";
import { useAkumaStore } from "@/lib/store";
import { PixelButton } from "./pixel-button";
import { Reveal } from "./reveal";

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
                      accent={game.accent}
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
  accent,
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
  accent: string;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <div
      className={`group relative h-full akuma-card-hover border-2 bg-[#121017] pixel-corner overflow-hidden ${
        selected
          ? "border-[#6ee7b7] shadow-[0_0_26px_rgba(110,231,183,0.45)]"
          : "border-[#a020f0]/50 group-hover:border-[#a020f0] group-hover:shadow-[0_0_24px_rgba(160,32,240,0.45)]"
      }`}
    >
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
            className="font-pixel text-[7px] uppercase px-2 py-1 pixel-corner"
            style={{ background: accent, color: "#0a0a0a" }}
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
      <div className="px-4 pb-4">
        <PixelButton
          variant={selected ? "silver" : "neon"}
          className="w-full"
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
      </div>
    </div>
  );
}
