"use client";

import { Sparkles, Plus, Check } from "lucide-react";
import { GAMES } from "@/lib/games-data";
import type { Game, ProductItem } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/**
 * Recommendations — "You might also like" section shown below items in store-view.
 * Pure frontend: pick 3 random items from OTHER games.
 *
 * Feature 6.
 */
export function Recommendations({ currentGameSlug }: { currentGameSlug: string }) {
  const adminGames = useAdminStore((s) => s.games);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const games = hydrated && adminGames.length > 0 ? adminGames : GAMES;
  const cartAdd = useCart((s) => s.add);
  const cartHas = useCart((s) => s.has);
  const { toast } = useToast();
  const t = useI18n((s) => s.t);
  useI18n((s) => s.lang);

  // Pick 3 random items from other games
  const recommendations = (() => {
    const otherGames = games.filter((g) => g.slug !== currentGameSlug);
    const pool: { game: Game; item: ProductItem; category: string }[] = [];
    for (const g of otherGames) {
      for (const cat of g.categories) {
        for (const item of cat.items as ProductItem[]) {
          pool.push({ game: g, item, category: cat.name });
        }
      }
    }
    // Shuffle deterministically by length, take 3
    const seed = currentGameSlug.length + 7;
    const sorted = [...pool].sort((a, b) => {
      const ha = (a.item.name.charCodeAt(0) + a.game.slug.length * seed) % 97;
      const hb = (b.item.name.charCodeAt(0) + b.game.slug.length * seed) % 97;
      return ha - hb;
    });
    return sorted.slice(0, 3);
  })();

  if (recommendations.length === 0) return null;

  const handleAdd = (game: Game, item: ProductItem, category: string) => {
    const id = `${game.slug}-${item.id}`;
    if (cartHas(id)) return;
    const ok = cartAdd({
      id,
      gameSlug: game.slug,
      gameName: game.name,
      gameEmoji: game.emoji,
      productId: item.id,
      productName: item.name,
      priceLabel: item.priceLabel,
      price: item.price,
      category,
    });
    if (ok) {
      toast({ title: t("store.addedToCart"), description: `${item.name} (${item.priceLabel})` });
    } else {
      toast({ title: t("store.duplicateCart"), variant: "destructive" });
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 border-t border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-4 text-amber-400" />
        <p className="text-xs text-amber-400 uppercase tracking-widest font-semibold">
          {t("recommendations.title")}
        </p>
      </div>
      <h2 className="text-lg font-bold text-zinc-100 mb-1">{t("recommendations.title")}</h2>
      <p className="text-xs text-zinc-500 mb-5">{t("recommendations.subtitle")}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((r, i) => {
          const inCart = cartHas(`${r.game.slug}-${r.item.id}`);
          return (
            <Reveal key={`${r.game.slug}-${r.item.id}`} delay={i * 60}>
              <div
                className="group h-full border-2 bg-[#121017] pixel-corner overflow-hidden transition-all hover:border-[#a020f0] hover:shadow-[0_0_24px_rgba(160,32,240,0.35)]"
                style={{ borderColor: r.game.accent + "50" }}
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-[#2a2436] bg-[#0a0a0a]/60">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg border text-base"
                    style={{ borderColor: r.game.accent + "40", backgroundColor: r.game.accent + "10" }}
                  >
                    {r.game.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 truncate">{r.game.name}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{r.category}</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-pixel text-xs text-[#e5e5e5] leading-relaxed line-clamp-2">{r.item.name}</h3>
                  {r.item.description && (
                    <p className="mt-1.5 text-[10px] text-[#9a93a8] line-clamp-2">{r.item.description}</p>
                  )}
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <span className="font-pixel text-xl text-[#c44bff] text-glow-neon">{r.item.priceLabel}</span>
                      <span className="font-pixel text-[8px] text-[#9a93a8] uppercase ml-1">{t("store.price")}</span>
                    </div>
                    <button
                      onClick={() => handleAdd(r.game, r.item, r.category)}
                      disabled={inCart}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-pixel uppercase transition-all active:scale-95",
                        inCart
                          ? "bg-green-500/15 border border-green-500/30 text-green-400 cursor-default"
                          : "bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400"
                      )}
                    >
                      {inCart ? (
                        <><Check className="size-3.5" /> {t("cart.inCart")}</>
                      ) : (
                        <><Plus className="size-3.5" /> {t("recommendations.addToCart")}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
