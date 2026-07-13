"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import type { Game } from "@/lib/games-data";

const EMOJI_OPTIONS = ["⚔️", "🏔️", "🏪", "🎮", "🎯", "🎲", "👑", "💀", "🔥", "⭐", "🌟", "🃏"];
const ACCENT_OPTIONS = ["#a020f0", "#25D366", "#7fd4ff", "#ffd166", "#ff6ad5", "#ff3b6b", "#6ee7b7"];

export default function NewGamePage() {
  const router = useRouter();
  const addGame = useAdminStore((s) => s.addGame);
  const createCommit = useAdminStore((s) => s.createCommit);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    emoji: "🎮",
    accent: "#a020f0",
  });

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || slugify(form.name);
    if (!form.name || !slug) {
      toast({ title: "Lengkapi data", variant: "destructive" });
      return;
    }
    const game: Game = {
      slug,
      name: form.name,
      tagline: form.tagline || "Joki profesional",
      description: form.description || `Joki ${form.name} profesional.`,
      emoji: form.emoji,
      accent: form.accent,
      categories: [],
    };
    addGame(game);
    createCommit(`Tambah game: ${form.name}`, "admin");
    toast({ title: "Game ditambahkan!", description: form.name });
    router.push("/admin/games");
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/games"
          className="inline-flex items-center gap-2 font-pixel text-[8px] uppercase text-[#9a93a8] hover:text-[#c44bff]"
        >
          <ArrowLeft className="size-3" /> Kembali
        </Link>
        <h1 className="mt-3 font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          TAMBAH GAME
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner p-6 space-y-5 max-w-2xl"
      >
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Nama Game</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
            placeholder="Mis. Blox Fruits"
            required
            className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none"
          />
        </div>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Slug (URL)</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            placeholder="blox-fruits"
            required
            className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none"
          />
        </div>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="Sail. Slice. Dominate."
            className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none"
          />
        </div>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Deskripsi</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Joki leveling, raid, dan senjata langka..."
            rows={3}
            className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none resize-none"
          />
        </div>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Emoji</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setForm({ ...form, emoji: em })}
                className={`flex h-9 w-9 items-center justify-center border-2 pixel-corner text-lg transition-all ${
                  form.emoji === em
                    ? "border-[#a020f0] bg-[#a020f0]/20 shadow-[0_0_8px_rgba(160,32,240,0.5)]"
                    : "border-[#2a2436] hover:border-[#a020f0]/60"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Warna Aksen</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENT_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, accent: c })}
                className={`h-9 w-9 border-2 pixel-corner transition-all ${
                  form.accent === c ? "scale-110" : ""
                }`}
                style={{
                  background: c,
                  borderColor: form.accent === c ? "#e5e5e5" : "transparent",
                  boxShadow: form.accent === c ? `0 0 10px ${c}` : "none",
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <PixelButton type="submit" size="lg">
            <Plus className="size-4" /> Tambah Game
          </PixelButton>
          <PixelButton type="button" size="lg" variant="silver" asChild>
            <Link href="/admin/games">Batal</Link>
          </PixelButton>
        </div>
      </form>
    </div>
  );
}
