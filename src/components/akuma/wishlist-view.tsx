"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ShoppingCart, Share2, MessageCircle } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { Reveal } from "@/components/akuma/reveal";
import { Starfield, MovingGrid } from "@/components/akuma/backgrounds";
import { WHATSAPP_NUMBER } from "@/lib/games-data";

export function WishlistView() {
  const items = useWishlist((s) => s.items);
  const hydrated = useWishlist((s) => s._hasHydrated);
  const remove = useWishlist((s) => s.remove);
  const clear = useWishlist((s) => s.clear);
  const cartAdd = useCart((s) => s.add);
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (productId: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleAddSelectedToCart = () => {
    if (selected.size === 0) {
      toast({ title: "Pilih item dulu", variant: "destructive" });
      return;
    }
    let count = 0;
    for (const item of items) {
      if (selected.has(item.productId)) {
        cartAdd({
          id: `${item.gameSlug}-${item.productId}`,
          productId: item.productId,
          productName: item.productName,
          priceLabel: item.priceLabel,
          price: 0,
          category: "",
          gameSlug: item.gameSlug,
          gameName: item.gameName,
        });
        count++;
      }
    }
    toast({ title: `${count} item ditambah ke keranjang! 🛒` });
    setSelected(new Set());
  };

  const handleShareWA = () => {
    if (items.length === 0) return;
    const text = `*Wishlist AKUMA JOKI saya:*\n\n${items.map((i, idx) => `${idx + 1}. ${i.emoji} ${i.productName} - ${i.gameName} (${i.priceLabel})`).join("\n")}\n\nMau order, kak!`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!hydrated) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <Starfield />
        <p className="text-sm text-zinc-500">Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <Starfield />
      <MovingGrid />

      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-12 sm:pt-20 pb-6">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full glass-nav px-4 py-1.5 mb-5">
            <Heart className="size-3.5 text-pink-400" />
            <span className="text-[10px] sm:text-xs font-pixel uppercase tracking-widest text-pink-400">
              Wishlist
            </span>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl leading-tight text-gradient">
            Wishlist <span className="text-pink-400 ml-3">Kamu</span>
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-4 text-sm text-zinc-400">
            {items.length === 0
              ? "Belum ada item favorit. Jelajahi store dan tap ❤️ untuk simpan."
              : `${items.length} item tersimpan. Pilih beberapa untuk tambah ke keranjang sekaligus.`}
          </p>
        </Reveal>
      </section>

      {items.length > 0 && (
        <section className="relative mx-auto max-w-5xl px-4 sm:px-6 pb-6 flex flex-wrap gap-2">
          <button
            onClick={handleAddSelectedToCart}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all disabled:opacity-50"
          >
            <ShoppingCart className="size-4" /> Add Selected to Cart ({selected.size})
          </button>
          <button
            onClick={handleShareWA}
            className="inline-flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-2 text-sm text-green-400 hover:bg-green-500/20 transition-all"
          >
            <MessageCircle className="size-4" /> Share via WhatsApp
          </button>
          <button
            onClick={() => { if (confirm("Hapus semua wishlist?")) { clear(); toast({ title: "Wishlist dikosongkan" }); } }}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="size-4" /> Clear All
          </button>
        </section>
      )}

      <section className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {items.length === 0 ? (
          <Reveal>
            <div className="glass rounded-3xl p-12 text-center">
              <Heart className="mx-auto size-12 text-zinc-700 mb-4" />
              <p className="text-sm text-zinc-500 mb-4">Wishlist kamu masih kosong.</p>
              <Link
                href="/#games"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all"
              >
                Jelajahi Store →
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass rounded-2xl p-4 transition-all ${selected.has(item.productId) ? "border-pink-500/40 bg-pink-500/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelect(item.productId)}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${selected.has(item.productId) ? "bg-pink-500 border-pink-500" : "border-white/20"}`}
                      aria-label="Pilih"
                    >
                      {selected.has(item.productId) && <span className="text-[10px] text-white">✓</span>}
                    </button>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-lg">
                      {item.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/store/${item.gameSlug}`} className="block">
                        <p className="text-sm font-medium text-zinc-100 truncate hover:text-violet-400 transition-colors">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">{item.gameName}</p>
                      </Link>
                      <p className="mt-1 text-sm font-semibold text-violet-400">{item.priceLabel}</p>
                    </div>
                    <button
                      onClick={() => { remove(item.productId); toast({ title: "Dihapus dari wishlist" }); }}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      aria-label="Hapus"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
