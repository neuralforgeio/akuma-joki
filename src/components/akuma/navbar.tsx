"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { GAMES as DEFAULT_GAMES } from "@/lib/games-data";
import type { Game, ProductItem } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "./pixel-button";
import { cn } from "@/lib/utils";

export function Navbar() {
  // Baca games dari admin store (ter-sync dari GitHub). Fallback ke DEFAULT_GAMES.
  const adminGames = useAdminStore((s) => s.games);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const games = hydrated && adminGames.length > 0 ? adminGames : DEFAULT_GAMES;
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Build search index: all games + all items
  type SearchEntry = {
    type: "game" | "item";
    label: string;
    sublabel: string;
    href: string;
    emoji: string;
    accent: string;
    priceLabel?: string;
  };
  const searchIndex = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];
    for (const g of games) {
      entries.push({
        type: "game",
        label: g.name,
        sublabel: g.tagline,
        href: `/store/${g.slug}`,
        emoji: g.emoji,
        accent: g.accent,
      });
      for (const cat of g.categories) {
        for (const item of cat.items as ProductItem[]) {
          entries.push({
            type: "item",
            label: item.name,
            sublabel: `${g.name} · ${cat.name}`,
            href: `/store/${g.slug}`,
            emoji: g.emoji,
            accent: g.accent,
            priceLabel: item.priceLabel,
          });
        }
      }
    }
    return entries;
  }, [games]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          e.sublabel.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery, searchIndex]);

  // close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // close search on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  // focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => window.clearTimeout(t);
    }
  }, [searchOpen]);

  // keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
          {games.map((g) => (
            <NavTab key={g.slug} active={isActiveStore(g.slug)} href={`/store/${g.slug}`}>
              <span className="mr-1">{g.emoji}</span>
              {g.name}
            </NavTab>
          ))}
        </div>

        {/* Search + Checkout */}
        <div className="hidden md:flex items-center gap-3">
          {/* Search */}
          <div ref={searchContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Cari game atau joki"
              aria-expanded={searchOpen}
              className="flex h-9 w-9 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner transition-colors hover:border-[#a020f0] hover:text-[#c44bff]"
            >
              <Search className="size-4" />
            </button>

            {/* Search dropdown */}
            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0a] border-2 border-[#a020f0]/60 pixel-corner shadow-[0_0_0_2px_#0a0a0a,0_0_18px_rgba(160,32,240,0.35)] z-50">
                <div className="border-b-2 border-[#a020f0]/30 p-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari game atau joki..."
                    aria-label="Cari game atau joki"
                    className="w-full bg-transparent px-2 py-1.5 text-sm text-[#e5e5e5] placeholder:text-[#9a93a8] outline-none"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="px-3 py-4 text-center font-pixel text-[7px] uppercase tracking-wide text-[#5a5266]">
                      {searchQuery ? "Tidak ada hasil" : "Ketik untuk mencari"}
                    </p>
                  ) : (
                    searchResults.map((r, i) => (
                      <Link
                        key={`${r.type}-${r.label}-${i}`}
                        href={r.href}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#a020f0]/10 transition-colors border-b border-[#2a2436] last:border-0"
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center border pixel-corner text-sm"
                          style={{ borderColor: r.accent }}
                        >
                          {r.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#e5e5e5] truncate">{r.label}</p>
                          <p className="text-[10px] text-[#9a93a8] truncate">{r.sublabel}</p>
                        </div>
                        {r.priceLabel && (
                          <span className="font-pixel text-[8px] text-[#c44bff] shrink-0">
                            {r.priceLabel}
                          </span>
                        )}
                        {r.type === "game" && (
                          <span className="font-pixel text-[6px] uppercase text-[#9a93a8] shrink-0">
                            Game
                          </span>
                        )}
                      </Link>
                    ))
                  )}
                </div>
                <div className="border-t-2 border-[#a020f0]/20 bg-[#121017] px-3 py-1.5">
                  <p className="font-pixel text-[6px] uppercase tracking-wide text-[#5a5266]">
                    Ctrl+K · Esc tutup
                  </p>
                </div>
              </div>
            )}
          </div>

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
          {/* Mobile search */}
          <div className="relative mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari game atau joki..."
              aria-label="Cari game atau joki"
              className="w-full bg-[#121017] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] placeholder:text-[#9a93a8] px-3 py-2.5 text-sm pixel-corner outline-none"
            />
            {searchQuery && searchResults.length > 0 && (
              <div className="mt-1 space-y-1">
                {searchResults.slice(0, 5).map((r, i) => (
                  <Link
                    key={`m-${r.type}-${r.label}-${i}`}
                    href={r.href}
                    onClick={() => {
                      setMobileOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-2 px-2 py-2 bg-[#121017] border border-[#2a2436] pixel-corner"
                  >
                    <span className="text-sm">{r.emoji}</span>
                    <span className="text-xs text-[#e5e5e5] truncate flex-1">{r.label}</span>
                    {r.priceLabel && (
                      <span className="font-pixel text-[7px] text-[#c44bff]">{r.priceLabel}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <MobileTab active={isHome} href="/" onClick={() => setMobileOpen(false)}>
            🏠 Home
          </MobileTab>
          {games.map((g) => (
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
