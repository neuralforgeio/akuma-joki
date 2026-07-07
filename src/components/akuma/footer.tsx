"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ShieldCheck, Zap, Wallet } from "lucide-react";
import { GAMES, WHATSAPP_NUMBER } from "@/lib/games-data";

export function Footer() {
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Halo AKUMA JOKI, saya mau tanya-tanya soal joki 🔥"
  )}`;

  return (
    <footer className="mt-auto relative border-t-2 border-[#a020f0]/60 bg-[#0a0a0a]">
      {/* top neon strip */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#a020f0] to-transparent shadow-[0_0_18px_rgba(160,32,240,0.7)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <div className="relative h-12 w-24 logo-glow rounded-sm overflow-hidden">
                <Image
                  src="/akuma-logo.png"
                  alt="AKUMA JOKI"
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-[#9a93a8] leading-relaxed">
              Joki &amp; Store Roblox dengan tema retro pixel. Aman, cepat, dan harga
              bersahabat. Taklukkan setiap game bareng AKUMA!
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <FooterChip icon={<ShieldCheck className="size-3.5" />}>Aman</FooterChip>
              <FooterChip icon={<Zap className="size-3.5" />}>Cepat</FooterChip>
              <FooterChip icon={<Wallet className="size-3.5" />}>Murah</FooterChip>
            </div>
          </div>

          {/* Games */}
          <div>
            <p className="font-pixel text-[10px] uppercase text-[#c44bff] mb-4">Games</p>
            <ul className="space-y-2 text-sm">
              {GAMES.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/store/${g.slug}`}
                    className="text-[#9a93a8] hover:text-[#e5e5e5] transition-colors"
                  >
                    {g.emoji} {g.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/" className="text-[#9a93a8] hover:text-[#e5e5e5] transition-colors">
                  🏠 Beranda
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-pixel text-[10px] uppercase text-[#c44bff] mb-4">Kontak</p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-pixel text-[10px] text-[#0a0a0a] bg-[#25D366] px-4 py-3 pixel-corner border-2 border-[#25D366] hover:bg-[#37e07a] transition-colors shadow-[0_0_14px_rgba(37,211,102,0.45)]"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp Admin
            </a>
            <p className="mt-4 text-xs text-[#9a93a8] font-mono">+62 821-3156-1301</p>
            <p className="mt-1 text-xs text-[#9a93a8]">Jam operasional: 09.00 – 24.00 WIB</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#2a2436] pt-6">
          <p className="font-pixel text-[8px] text-[#9a93a8] uppercase tracking-wide">
            © {new Date().getFullYear()} AKUMA JOKI — All Rights Reserved
          </p>
          <p className="font-pixel text-[8px] text-[#a020f0] uppercase tracking-wide">
            Press Start ▸ Dominate
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterChip({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[#a020f0]/40 text-[#e5e5e5] text-xs pixel-corner bg-[#a020f0]/5">
      <span className="text-[#c44bff]">{icon}</span>
      {children}
    </span>
  );
}
