"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ShieldCheck, Zap, Wallet } from "lucide-react";
import { GAMES as DEFAULT_GAMES, WHATSAPP_NUMBER } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const adminGames = useAdminStore((s) => s.games);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const games = hydrated && adminGames.length > 0 ? adminGames : DEFAULT_GAMES;
  const t = useI18n((s) => s.t);
  // Subscribe to lang so this component re-renders when language changes
  useI18n((s) => s.lang);
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo AKUMA JOKI, saya mau tanya-tanya soal joki 🔥")}`;

  return (
    <footer className="mt-auto relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative h-10 w-20 rounded-lg overflow-hidden ring-2 ring-violet-500/30">
                  <Image src="/akuma-logo.png" alt="AKUMA JOKI" fill sizes="80px" className="object-contain" />
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{t("footer.tagline")}</p>
            </div>

            {/* Games */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{t("footer.games")}</h4>
              <div className="space-y-2">
                {games.map((g) => (
                  <Link key={g.slug} href={`/store/${g.slug}`} className="block text-sm text-zinc-400 hover:text-violet-400 transition-colors">
                    {g.emoji} {g.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{t("footer.features")}</h4>
              <div className="space-y-2 text-sm text-zinc-400">
                <div className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-violet-400" /> {t("footer.dataAman")}</div>
                <div className="flex items-center gap-2"><Zap className="size-3.5 text-violet-400" /> {t("footer.prosesCepat")}</div>
                <div className="flex items-center gap-2"><Wallet className="size-3.5 text-violet-400" /> {t("footer.hargaBersahabat")}</div>
                <div className="flex items-center gap-2"><MessageCircle className="size-3.5 text-violet-400" /> {t("footer.chatLangsung")}</div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{t("footer.kontak")}</h4>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400 hover:bg-green-500/20 transition-all">
                <MessageCircle className="size-4" /> {t("footer.waAdmin")}
              </a>
              <Link href="/track-order" className="mt-2 block text-sm text-zinc-400 hover:text-violet-400 transition-colors">
                📦 {t("footer.lacakOrder")}
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-zinc-600">{t("footer.copyright")}</p>
            <p className="text-xs text-zinc-600">{t("footer.poweredBy")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
