import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGameBySlug, VALID_SLUGS } from "@/lib/games-data";
import { StoreView } from "@/components/akuma/store-view";

export const dynamicParams = false;

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
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
