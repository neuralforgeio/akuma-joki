"use client";

import Link from "next/link";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { HelpBanner } from "@/components/admin/help-tooltip";
import { Gamepad2, Plus, Edit3, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminGamesPage() {
  const games = useAdminStore((s) => s.games);
  const deleteGame = useAdminStore((s) => s.deleteGame);
  const { toast } = useToast();

  const handleDelete = (slug: string, name: string) => {
    if (confirm(`Hapus game "${name}"? Ini tidak bisa diundo.`)) {
      deleteGame(slug);
      toast({ title: "Game dihapus", description: name });
    }
  };

  return (
    <div className="space-y-6">
      <HelpBanner
        title="Kelola Game"
        description="Tambah, edit, atau hapus game yang tersedia di store. Setiap perubahan otomatis tersimpan ke GitHub dan website terupdate."
        tips={[
          "Klik 'Tambah Game' untuk membuat game baru",
          "Klik 'Edit' untuk mengubah game atau menambah item joki",
          "Klik ikon merah untuk menghapus game (dengan konfirmasi)",
          "Game baru akan otomatis muncul di navbar, homepage, dan widget WhatsApp",
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
            GAMES
          </h1>
          <p className="mt-1 text-sm text-[#9a93a8]">
            Kelola game yang tersedia di store.
          </p>
        </div>
        <PixelButton size="sm" asChild>
          <Link href="/admin/games/new">
            <Plus className="size-3.5" /> Tambah Game
          </Link>
        </PixelButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => {
          const itemCount = g.categories.reduce((a, c) => a + c.items.length, 0);
          return (
            <div
              key={g.slug}
              className="group border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4 akuma-card-hover"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center border-2 pixel-corner text-2xl"
                  style={{ borderColor: g.accent, boxShadow: `0 0 12px ${g.accent}55` }}
                >
                  {g.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-pixel text-[10px] text-[#e5e5e5] truncate">
                    {g.name}
                  </h3>
                  <p className="text-[10px] text-[#9a93a8] mt-1 truncate">{g.tagline}</p>
                  <p className="font-pixel text-[7px] text-[#c44bff] mt-1">
                    {itemCount} items · {g.categories.length} kategori
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <PixelButton size="sm" variant="silver" className="flex-1" asChild>
                  <Link href={`/admin/games/${g.slug}`}>
                    <Edit3 className="size-3" /> Edit
                  </Link>
                </PixelButton>
                <button
                  onClick={() => handleDelete(g.slug, g.name)}
                  className="flex h-8 w-8 items-center justify-center border-2 border-[#ff3b6b]/40 text-[#ff3b6b] pixel-corner hover:bg-[#ff3b6b]/10 transition-colors"
                  aria-label="Hapus game"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {games.length === 0 && (
        <div className="text-center py-16">
          <Gamepad2 className="mx-auto size-12 text-[#2a2436]" />
          <p className="mt-4 font-pixel text-[9px] uppercase text-[#9a93a8]">
            Belum ada game
          </p>
          <PixelButton size="sm" className="mt-4" asChild>
            <Link href="/admin/games/new">
              <Plus className="size-3.5" /> Tambah Game Pertama
            </Link>
          </PixelButton>
        </div>
      )}
    </div>
  );
}
