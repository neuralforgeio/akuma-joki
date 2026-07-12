"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Search, ChevronDown, Gamepad2, Info, Bug } from "lucide-react";
import { GAMES as DEFAULT_GAMES } from "@/lib/games-data";
import type { Game, ProductItem } from "@/lib/games-data";
import { useAdminStore } from "@/lib/admin-store";
import { cn } from "@/lib/utils";

export function Navbar() {
  const adminGames = useAdminStore((s) => s.games);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const games = hydrated && adminGames.length > 0 ? adminGames : DEFAULT_GAMES;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [mobileGamesOpen, setMobileGamesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const gamesDropdownRef = useRef<HTMLDivElement>(null);

  type SearchEntry = { type: "game" | "item"; label: string; sublabel: string; href: string; emoji: string; accent: string; priceLabel?: string };
  const searchIndex = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];
    for (const g of games) {
      entries.push({ type: "game", label: g.name, sublabel: g.tagline, href: `/store/${g.slug}`, emoji: g.emoji, accent: g.accent });
      for (const cat of g.categories) for (const item of cat.items as ProductItem[])
        entries.push({ type: "item", label: item.name, sublabel: `${g.name} · ${cat.name}`, href: `/store/${g.slug}`, emoji: g.emoji, accent: g.accent, priceLabel: item.priceLabel });
    }
    return entries;
  }, [games]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchIndex.filter((e) => e.label.toLowerCase().includes(q) || e.sublabel.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, searchIndex]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (gamesDropdownRef.current && !gamesDropdownRef.current.contains(e.target as Node)) setGamesOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchOpen(false); setSearchQuery(""); setGamesOpen(false); setMobileGamesOpen(false);
  }, [pathname]);
  useEffect(() => { if (searchOpen) { const t = setTimeout(() => searchInputRef.current?.focus(), 100); return () => clearTimeout(t); } }, [searchOpen]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(v => !v); } if (e.key === "Escape") { setSearchOpen(false); setGamesOpen(false); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 12); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);

  const isHome = pathname === "/";
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";
  const isActiveStore = (slug: string) => pathname === `/store/${slug}`;
  const isCheckout = pathname === "/checkout";
  const isAnyStore = pathname.startsWith("/store/");

  return (
    <header className={cn("sticky top-0 z-50 w-full transition-all duration-500", scrolled ? "py-2" : "py-3")}>
      <nav className={cn("mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-500", scrolled ? "glass-strong shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]" : "glass")}>
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label="AKUMA JOKI home">
          <div className="relative h-9 w-18 sm:h-10 sm:w-20 shrink-0 rounded-lg overflow-hidden ring-2 ring-violet-500/30 group-hover:ring-violet-500/50 transition-all">
            <Image src="/akuma-logo.png" alt="AKUMA JOKI logo" fill sizes="80px" className="object-contain" priority />
          </div>
        </Link>

        {/* Desktop nav: Home → About → Games (dropdown) → Contact */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink active={isHome} href="/">Home</NavLink>
          <NavLink active={isAbout} href="/about">
            <span className="mr-1 inline-flex items-center"><Info className="size-3.5" /></span>About
          </NavLink>

          {/* Games dropdown */}
          <div ref={gamesDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setGamesOpen(v => !v)}
              onMouseEnter={() => setGamesOpen(true)}
              aria-label="Daftar games"
              aria-expanded={gamesOpen}
              className={cn(
                "relative inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300",
                isAnyStore || gamesOpen ? "text-violet-400" : "text-zinc-400 hover:text-zinc-100"
              )}
            >
              <Gamepad2 className="size-3.5 mr-1" />
              Games
              <ChevronDown className={cn("size-3.5 ml-0.5 transition-transform duration-300", gamesOpen && "rotate-180")} />
              {(isAnyStore || gamesOpen) && <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full" />}
            </button>

            {/* Dropdown panel */}
            {gamesOpen && (
              <div
                onMouseLeave={() => setGamesOpen(false)}
                className="absolute left-0 top-full pt-2 w-72 z-50"
              >
                <div className="glass-strong rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {games.length} Game Tersedia
                    </p>
                    <span className="text-[10px] text-zinc-600">Pilih untuk lihat</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto akuma-scroll">
                    {games.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/store/${g.slug}`}
                        onClick={() => setGamesOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 transition-colors border-b border-white/5 last:border-0",
                          isActiveStore(g.slug) ? "bg-violet-500/10" : "hover:bg-white/5"
                        )}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base"
                          style={{ borderColor: g.accent + "40", backgroundColor: g.accent + "10" }}
                        >
                          {g.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm truncate", isActiveStore(g.slug) ? "text-violet-400 font-medium" : "text-zinc-100")}>
                            {g.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">{g.tagline}</p>
                        </div>
                        {isActiveStore(g.slug) && <span className="text-[10px] text-violet-400">●</span>}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/#games"
                    onClick={() => setGamesOpen(false)}
                    className="block px-4 py-2.5 text-center text-[11px] text-violet-400 hover:bg-violet-500/10 transition-colors border-t border-white/8"
                  >
                    Lihat semua game →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <NavLink active={isContact} href="/contact">
            <span className="mr-1 inline-flex items-center"><Bug className="size-3.5" /></span>Contact
          </NavLink>
        </div>

        {/* Search + Checkout */}
        <div className="flex items-center gap-2.5">
          <div ref={searchContainerRef} className="relative">
            <button type="button" onClick={() => setSearchOpen(v => !v)} aria-label="Cari game atau joki" aria-expanded={searchOpen}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-all">
              <Search className="size-4" />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
                <div className="border-b border-white/8 p-3">
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari game atau joki..." aria-label="Cari" className="w-full bg-transparent px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none" />
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-zinc-500">{searchQuery ? "Tidak ada hasil" : "Ketik untuk mencari"}</p>
                  ) : searchResults.map((r, i) => (
                    <Link key={`${r.type}-${i}`} href={r.href} onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm" style={{ borderColor: r.accent + "40" }}>{r.emoji}</span>
                      <div className="min-w-0 flex-1"><p className="text-sm text-zinc-100 truncate">{r.label}</p><p className="text-[10px] text-zinc-500 truncate">{r.sublabel}</p></div>
                      {r.priceLabel && <span className="text-xs font-semibold text-violet-400 shrink-0">{r.priceLabel}</span>}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-white/8 px-3 py-2"><p className="text-[10px] text-zinc-600">Ctrl+K · Esc tutup</p></div>
              </div>
            )}
          </div>
          <Link href="/checkout" className={cn("hidden sm:inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-pixel uppercase tracking-wide transition-all duration-300", isCheckout ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-[0_4px_20px_-4px_rgba(139,92,246,0.5)]" : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 backdrop-blur-sm")}>
            🛒 Checkout
          </Link>

          {/* Mobile toggle */}
          <button className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-300" onClick={() => setMobileOpen(v => !v)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={cn("md:hidden overflow-hidden transition-all duration-300 mt-2 mx-auto max-w-6xl px-4", mobileOpen ? "max-h-[600px]" : "max-h-0")}>
        <div className="glass-strong rounded-2xl p-4 space-y-2">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari game atau joki..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none mb-2" />
          {searchQuery && searchResults.length > 0 && (
            <div className="space-y-1 mb-2">{searchResults.slice(0, 5).map((r, i) => (
              <Link key={`m-${i}`} href={r.href} onClick={() => { setMobileOpen(false); setSearchQuery(""); }} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-sm">{r.emoji}</span><span className="text-xs text-zinc-200 truncate flex-1">{r.label}</span>
                {r.priceLabel && <span className="text-xs text-violet-400">{r.priceLabel}</span>}
              </Link>
            ))}</div>
          )}
          <MobileLink active={isHome} href="/" onClick={() => setMobileOpen(false)}>🏠 Home</MobileLink>
          <MobileLink active={isAbout} href="/about" onClick={() => setMobileOpen(false)}>ℹ️ About</MobileLink>

          {/* Games collapsible in mobile */}
          <button
            onClick={() => setMobileGamesOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:bg-white/5 border border-transparent"
          >
            <span className="flex items-center gap-2"><Gamepad2 className="size-4" /> Games</span>
            <ChevronDown className={cn("size-4 transition-transform", mobileGamesOpen && "rotate-180")} />
          </button>
          {mobileGamesOpen && (
            <div className="ml-3 pl-3 border-l border-white/10 space-y-1 max-h-64 overflow-y-auto akuma-scroll">
              {games.map((g) => (
                <Link
                  key={g.slug}
                  href={`/store/${g.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all",
                    isActiveStore(g.slug) ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-zinc-300 hover:bg-white/5 border border-transparent"
                  )}
                >
                  <span className="text-base">{g.emoji}</span>
                  <span className="truncate">{g.name}</span>
                </Link>
              ))}
            </div>
          )}

          <MobileLink active={isContact} href="/contact" onClick={() => setMobileOpen(false)}>🐛 Contact</MobileLink>
          <MobileLink active={isCheckout} href="/checkout" onClick={() => setMobileOpen(false)}>🛒 Checkout</MobileLink>
        </div>
      </div>
    </header>
  );
}

function NavLink({ active, href, children }: { active?: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("relative px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-300", active ? "text-violet-400" : "text-zinc-400 hover:text-zinc-100")}>
      {children}
      {active && <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full" />}
    </Link>
  );
}

function MobileLink({ active, href, onClick, children }: { active?: boolean; href: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className={cn("block px-4 py-3 rounded-xl text-sm font-medium transition-all", active ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-zinc-300 hover:bg-white/5 border border-transparent")}>
      {children}
    </Link>
  );
}
