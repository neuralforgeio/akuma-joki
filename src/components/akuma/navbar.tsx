"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { GAMES } from "@/lib/games-data";
import { PixelButton } from "./pixel-button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change (via pathname) — handled in link onClick below.

  const isHome = pathname === "/";
  const isActiveStore = (slug: string) => pathname === `/store/${slug}`;
  const isCheckout = pathname === "/checkout";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background,border-color,box-shadow] duration-300",
        scrolled
          ? "bg-[#0a0a0a]/90 backdrop-blur-md border-b-2 border-[#a020f0] shadow-[0_4px_24px_rgba(160,32,240,0.25)]"
          : "bg-[#0a0a0a]/60 backdrop-blur-sm border-b-2 border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3" aria-label="AKUMA JOKI home">
          <div className="relative h-10 w-20 sm:h-12 sm:w-24 shrink-0 logo-glow rounded-sm overflow-hidden">
            <Image
              src="/akuma-logo.png"
              alt="AKUMA JOKI logo"
              fill
              sizes="96px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavTab active={isHome} href="/">
            Home
          </NavTab>
          {GAMES.map((g) => (
            <NavTab key={g.slug} active={isActiveStore(g.slug)} href={`/store/${g.slug}`}>
              <span className="mr-1">{g.emoji}</span>
              {g.name}
            </NavTab>
          ))}
        </div>

        <div className="hidden md:block">
          <PixelButton size="sm" variant={isCheckout ? "neon" : "silver"} asChild>
            <Link href="/checkout">🛒 Checkout</Link>
          </PixelButton>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-[#e5e5e5] border-2 border-[#a020f0]/60 pixel-corner"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu (CSS height transition, no Framer Motion) */}
      <div
        className={cn(
          "md:hidden overflow-hidden border-t-2 border-[#a020f0]/40 bg-[#0a0a0a]/95 backdrop-blur transition-[max-height] duration-300",
          mobileOpen ? "max-h-[420px]" : "max-h-0 border-transparent"
        )}
      >
        <div className="flex flex-col gap-2 p-4">
          <MobileTab active={isHome} href="/" onClick={() => setMobileOpen(false)}>
            🏠 Home
          </MobileTab>
          {GAMES.map((g) => (
            <MobileTab key={g.slug} active={isActiveStore(g.slug)} href={`/store/${g.slug}`} onClick={() => setMobileOpen(false)}>
              {g.emoji} {g.name}
            </MobileTab>
          ))}
          <MobileTab active={isCheckout} href="/checkout" onClick={() => setMobileOpen(false)}>
            🛒 Checkout
          </MobileTab>
        </div>
      </div>
    </header>
  );
}

function NavTab({
  active,
  href,
  children,
}: {
  active?: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-pixel relative px-3 py-2 text-[9px] sm:text-[10px] uppercase tracking-wide transition-colors",
        active ? "text-[#c44bff]" : "text-[#e5e5e5]/70 hover:text-[#e5e5e5]"
      )}
    >
      <span className="flex items-center gap-1.5">{children}</span>
      {active && (
        <span className="absolute -bottom-0.5 left-2 right-2 h-[3px] bg-[#a020f0] shadow-[0_0_10px_rgba(160,32,240,0.9)]" />
      )}
    </Link>
  );
}

function MobileTab({
  active,
  href,
  children,
  onClick,
}: {
  active?: boolean;
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "font-pixel text-left px-3 py-3 text-[10px] uppercase border-2 pixel-corner transition-colors",
        active
          ? "bg-[#a020f0]/15 text-[#c44bff] border-[#a020f0]"
          : "text-[#e5e5e5]/80 border-[#2a2436] hover:border-[#a020f0]/60"
      )}
    >
      {children}
    </Link>
  );
}
