"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, X, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { GAMES } from "@/lib/games-data";
import type { ProductItem } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { useCart, MAX_CART_ITEMS } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * PriceCalculator — floating button (bottom-left, next to back-to-top).
 * Click → modal: select items + quantity → calculate total + bundle discount.
 * Bundle 3+ items = 10% off. "Add all to cart" button.
 *
 * Feature 8.
 */
type CalcLine = {
  key: string; // gameSlug + productId
  gameSlug: string;
  gameName: string;
  gameEmoji: string;
  productId: string;
  productName: string;
  priceLabel: string;
  price: number;
  qty: number;
};

export function PriceCalculator() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CalcLine[]>([]);
  const [pickerGame, setPickerGame] = useState<string>("");
  const adminGames = useAdminStore((s) => s.games);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const games = hydrated && adminGames.length > 0 ? adminGames : GAMES;
  const cartAdd = useCart((s) => s.add);
  const { toast } = useToast();
  const t = useI18n((s) => s.t);
  useI18n((s) => s.lang);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.qty, 0),
    [lines]
  );
  const totalQty = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const hasBundle = totalQty >= 3;
  const discount = hasBundle ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  const addItem = (gameSlug: string, item: ProductItem) => {
    const key = `${gameSlug}-${item.id}`;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      }
      const g = games.find((gg) => gg.slug === gameSlug);
      if (!g) return prev;
      return [
        ...prev,
        {
          key,
          gameSlug,
          gameName: g.name,
          gameEmoji: g.emoji,
          productId: item.id,
          productName: item.name,
          priceLabel: item.priceLabel,
          price: item.price,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (key: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: Math.max(0, l.qty + delta) } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const handleAddAllToCart = () => {
    let added = 0;
    let skipped = 0;
    for (const l of lines) {
      for (let i = 0; i < l.qty; i++) {
        const ok = cartAdd({
          id: `${l.gameSlug}-${l.productId}`,
          gameSlug: l.gameSlug,
          gameName: l.gameName,
          gameEmoji: l.gameEmoji,
          productId: l.productId,
          productName: l.productName,
          priceLabel: l.priceLabel,
          price: l.price,
          category: "",
        });
        if (ok) added++;
        else skipped++;
      }
    }
    if (added > 0) {
      toast({ title: t("calculator.added"), description: `${added} ${t("common.item")}` });
    }
    if (skipped > 0) {
      toast({ title: `${skipped} ${t("common.item")} ${t("store.duplicateCart")}`, variant: "destructive" });
    }
    setOpen(false);
    setLines([]);
  };

  const pickerItems: ProductItem[] = (() => {
    if (!pickerGame) return [];
    const g = games.find((gg) => gg.slug === pickerGame);
    if (!g) return [];
    return g.categories.flatMap((c) => c.items as ProductItem[]);
  })();

  return (
    <>
      {/* Floating button (bottom-left, next to back-to-top) */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        aria-label={t("calculator.title")}
        className="btn-shine fixed bottom-20 left-4 z-[9998] flex h-11 w-11 items-center justify-center bg-amber-500 text-white border-2 border-amber-400 pixel-corner shadow-[0_0_14px_rgba(251,191,36,0.6)] hover:bg-amber-400 transition-colors sm:bottom-6"
      >
        <Calculator className="size-4" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-nav-strong rounded-3xl max-w-lg w-full max-h-[88vh] overflow-hidden flex flex-col"
              style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <Calculator className="size-5 text-amber-400" />
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">{t("calculator.title")}</h2>
                    <p className="text-[10px] text-zinc-500">{t("calculator.subtitle")}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} aria-label={t("common.close")} className="text-zinc-500 hover:text-zinc-300">
                  <X className="size-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 akuma-scroll">
                {/* Item picker */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                    {t("calculator.selectItems")}
                  </label>
                  <select
                    value={pickerGame}
                    onChange={(e) => setPickerGame(e.target.value)}
                    className="mt-1.5 w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500/40"
                  >
                    <option value="">— {t("calculator.selectItems")} —</option>
                    {games.map((g) => (
                      <option key={g.slug} value={g.slug} className="bg-[#0a0a0a]">
                        {g.emoji} {g.name}
                      </option>
                    ))}
                  </select>

                  {pickerItems.length > 0 && (
                    <div className="mt-2 grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto akuma-scroll">
                      {pickerItems.map((item) => {
                        const key = `${pickerGame}-${item.id}`;
                        const inLines = lines.some((l) => l.key === key);
                        return (
                          <button
                            key={item.id}
                            onClick={() => addItem(pickerGame, item)}
                            className={cn(
                              "flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-left transition-all border",
                              inLines
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10"
                            )}
                          >
                            <span className="flex-1 truncate">{item.name}</span>
                            <span className="font-pixel text-violet-400 text-[10px]">{item.priceLabel}</span>
                            {inLines ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected lines */}
                {lines.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">{t("calculator.empty")}</p>
                ) : (
                  <div className="space-y-2">
                    {lines.map((l) => (
                      <div key={l.key} className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5">
                        <span className="text-lg">{l.gameEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-200 truncate">{l.productName}</p>
                          <p className="text-[9px] text-zinc-500 truncate">{l.gameName} · {l.priceLabel}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(l.key, -1)}
                            aria-label="-"
                            className="flex h-6 w-6 items-center justify-center rounded bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-semibold text-zinc-100">{l.qty}</span>
                          <button
                            onClick={() => updateQty(l.key, 1)}
                            aria-label="+"
                            className="flex h-6 w-6 items-center justify-center rounded bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <button onClick={() => removeLine(l.key)} aria-label={t("common.delete")} className="text-zinc-500 hover:text-red-400">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bundle note */}
                {totalQty > 0 && totalQty < 3 && (
                  <p className="text-[10px] text-amber-400/80 text-center">
                    💡 {t("calculator.bundleNote")}
                  </p>
                )}
              </div>

              {/* Footer / Summary */}
              <div className="border-t border-white/8 p-5 space-y-2 bg-[#0a0a0a]/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{t("calculator.subtotal")}</span>
                  <span className="text-zinc-200 font-semibold">{subtotal}K</span>
                </div>
                {hasBundle && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400">{t("calculator.discount")}</span>
                    <span className="text-amber-400 font-semibold">−{discount}K</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-sm font-semibold text-zinc-200">{t("calculator.total")}</span>
                  <span className="font-pixel text-xl text-gradient">{total}K</span>
                </div>
                <button
                  onClick={handleAddAllToCart}
                  disabled={lines.length === 0}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ShoppingCart className="size-4" /> {t("calculator.addToCart")}
                </button>
                {totalQty > MAX_CART_ITEMS && (
                  <p className="text-[10px] text-red-400 text-center">
                    ⚠️ {t("checkout.maxPerOrder")} ({MAX_CART_ITEMS})
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
