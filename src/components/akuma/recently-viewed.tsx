"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "./reveal";

export function RecentlyViewed() {
  const items = useRecentlyViewed((s) => s.items);
  const hydrated = useRecentlyViewed((s) => s._hasHydrated);
  const clearAll = useRecentlyViewed((s) => s.clearAll);
  const t = useI18n((s) => s.t);
  // Subscribe to lang so this component re-renders when language changes
  useI18n((s) => s.lang);

  if (!hydrated || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Reveal>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-violet-400" />
            <h2 className="text-sm font-pixel uppercase tracking-widest text-zinc-400">
              {t("section.recentlyViewed")}
            </h2>
          </div>
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
          >
            <X className="size-3" /> {t("common.clear")}
          </button>
        </div>
      </Reveal>
      <div className="flex gap-3 overflow-x-auto pb-2 akuma-scroll">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              href={`/store/${item.gameSlug}`}
              className="group block w-44 shrink-0 glass rounded-2xl p-3 hover:border-violet-500/30 transition-all hover:-translate-y-0.5"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg mb-2"
                style={{ borderColor: item.gameAccent + "40", backgroundColor: item.gameAccent + "10" }}
              >
                {item.gameEmoji}
              </div>
              <p className="text-xs font-medium text-zinc-200 truncate">{item.productName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{item.gameName}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-400">{item.priceLabel}</span>
                <span className="text-[9px] text-zinc-600">
                  {new Date(item.viewedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
