import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGameBySlug, VALID_SLUGS, SYNCED_GAMES, GAMES } from "@/lib/games-data";
import { StoreView } from "@/components/akuma/store-view";

// dynamicParams = true agar game baru yang di-add via dashboard (sync ke GitHub)
// tetap bisa diakses setelah redeploy, meski tidak ada di generateStaticParams awal.
export const dynamicParams = true;

export function generateStaticParams() {
  // Gabungan slug dari SYNCED_GAMES (data terbaru) + GAMES default.
  // Setelah admin add game + sync → Vercel redeploys → slug baru ter-generate.
  const allSlugs = Array.from(
    new Set([
      ...SYNCED_GAMES.map((g) => g.slug),
      ...GAMES.map((g) => g.slug),
    ])
  );
  return allSlugs.map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const game = getGameBySlug(slug);
    return {
      title: game ? `${game.name} — AKUMA JOKI Store` : "Store — AKUMA JOKI",
      description: game?.description ?? "AKUMA JOKI Store",
    };
  });
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();
  return <StoreView game={game} />;
}
