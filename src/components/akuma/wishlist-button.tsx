"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

/**
 * WishlistButton — tombol heart untuk toggle wishlist item.
 * Dipakai di ProductCard di store page.
 */
export function WishlistButton({
  gameSlug,
  gameName,
  productId,
  productName,
  priceLabel,
  emoji,
  accent,
}: {
  gameSlug: string;
  gameName: string;
  productId: string;
  productName: string;
  priceLabel: string;
  emoji: string;
  accent: string;
}) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(productId));
  const hydrated = useWishlist((s) => s._hasHydrated);

  if (!hydrated) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ gameSlug, gameName, productId, productName, priceLabel, emoji, addedAt: Date.now() });
      }}
      aria-label={has ? "Hapus dari wishlist" : "Tambah ke wishlist"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
        has
          ? "border-pink-500/40 bg-pink-500/10 text-pink-400"
          : "border-white/10 bg-white/5 text-zinc-400 hover:text-pink-400 hover:border-pink-500/30"
      )}
    >
      <Heart className={cn("size-4", has && "fill-pink-400")} />
    </button>
  );
}
