"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";

export default function EditGamePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const game = useAdminStore((s) => s.games.find((g) => g.slug === slug));
  const updateGame = useAdminStore((s) => s.updateGame);
  const addCategory = useAdminStore((s) => s.addCategory);
  const deleteCategory = useAdminStore((s) => s.deleteCategory);
  const addItem = useAdminStore((s) => s.addItem);
  const deleteItem = useAdminStore((s) => s.deleteItem);
  const createCommit = useAdminStore((s) => s.createCommit);
  const { toast } = useToast();

  const [editForm, setEditForm] = useState(
    game
      ? { name: game.name, tagline: game.tagline, description: game.description, emoji: game.emoji, accent: game.accent }
      : null
  );
  const [newCat, setNewCat] = useState({ name: "", icon: "📈" });
  const [newItem, setNewItem] = useState<Record<string, { name: string; price: string; priceLabel: string; tag: string; description: string; requirement: string }>>({});

  if (!game || !editForm) {
    return (
      <div className="text-center py-16">
        <p className="font-pixel text-[10px] uppercase text-[#9a93a8]">Game tidak ditemukan</p>
        <PixelButton size="sm" className="mt-4" asChild>
          <Link href="/admin/games">Kembali ke Games</Link>
        </PixelButton>
      </div>
    );
  }

  const handleSaveGame = () => {
    updateGame(slug, editForm);
    createCommit(`Edit game: ${editForm.name}`, "admin");
    toast({ title: "Game diupdate!" });
  };

  const handleAddCat = () => {
    if (!newCat.name) return;
    const id = newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    addCategory(slug, { id, name: newCat.name.toUpperCase(), icon: newCat.icon });
    setNewCat({ name: "", icon: "📈" });
    toast({ title: "Kategori ditambahkan!" });
  };

  const handleAddItem = (catId: string) => {
    const item = newItem[catId];
    if (!item || !item.name) return;
    const id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    addItem(slug, catId, {
      id,
      name: item.name,
      price: parseInt(item.price || "0", 10),
      priceLabel: item.priceLabel || `${item.price}K`,
      tag: item.tag || undefined,
      description: item.description || undefined,
      requirement: item.requirement || undefined,
    });
    setNewItem((s) => ({ ...s, [catId]: { name: "", price: "", priceLabel: "", tag: "", description: "", requirement: "" } }));
    toast({ title: "Item ditambahkan!" });
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
          EDIT: {game.name}
        </h1>
      </div>

      {/* edit game info */}
      <div className="border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner p-5 space-y-4">
        <h2 className="font-pixel text-[9px] uppercase text-[#c44bff]">Info Game</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="font-pixel text-[7px] uppercase text-[#9a93a8]">Nama</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="mt-1 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none"
            />
          </div>
          <div>
            <label className="font-pixel text-[7px] uppercase text-[#9a93a8]">Tagline</label>
            <input
              type="text"
              value={editForm.tagline}
              onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
              className="mt-1 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-pixel text-[7px] uppercase text-[#9a93a8]">Deskripsi</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={2}
              className="mt-1 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none resize-none"
            />
          </div>
          <div>
            <label className="font-pixel text-[7px] uppercase text-[#9a93a8]">Emoji</label>
            <input
              type="text"
              value={editForm.emoji}
              onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
              className="mt-1 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none"
            />
          </div>
          <div>
            <label className="font-pixel text-[7px] uppercase text-[#9a93a8]">Accent Color</label>
            <input
              type="text"
              value={editForm.accent}
              onChange={(e) => setEditForm({ ...editForm, accent: e.target.value })}
              className="mt-1 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none"
            />
          </div>
        </div>
        <PixelButton size="sm" onClick={handleSaveGame}>
          <Save className="size-3" /> Simpan
        </PixelButton>
      </div>

      {/* add category */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <h2 className="mb-3 font-pixel text-[9px] uppercase text-[#c44bff]">Tambah Kategori</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="font-pixel text-[7px] uppercase text-[#9a93a8]">Icon</label>
            <input
              type="text"
              value={newCat.icon}
              onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
              className="mt-1 w-16 bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none text-center"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="font-pixel text-[7px] uppercase text-[#9a93a8]">Nama Kategori</label>
            <input
              type="text"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              placeholder="LEVELING"
              className="mt-1 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none"
            />
          </div>
          <PixelButton size="sm" onClick={handleAddCat}>
            <Plus className="size-3" /> Tambah
          </PixelButton>
        </div>
      </div>

      {/* categories + items */}
      {game.categories.map((cat) => {
        const ni = newItem[cat.id] || { name: "", price: "", priceLabel: "", tag: "", description: "", requirement: "" };
        return (
          <div key={cat.id} className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">
                {cat.icon} {cat.name}
              </h3>
              <button
                onClick={() => {
                  if (confirm(`Hapus kategori ${cat.name}?`)) deleteCategory(slug, cat.id);
                }}
                className="flex items-center gap-1 font-pixel text-[7px] uppercase text-[#ff3b6b] border-2 border-[#ff3b6b]/40 px-2 py-1 pixel-corner hover:bg-[#ff3b6b]/10"
              >
                <Trash2 className="size-3" /> Hapus
              </button>
            </div>

            {/* items list */}
            <div className="space-y-2 mb-4">
              {cat.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border border-[#2a2436] bg-[#0a0a0a] pixel-corner px-3 py-2">
                  <span className="text-[#9a93a8]">•</span>
                  <span className="text-sm text-[#e5e5e5] flex-1 truncate">{item.name}</span>
                  {item.tag && (
                    <span className="font-pixel text-[6px] uppercase px-1.5 py-0.5 bg-[#a020f0]/20 text-[#c44bff] pixel-corner">
                      {item.tag}
                    </span>
                  )}
                  <span className="font-pixel text-[8px] text-[#c44bff]">{item.priceLabel}</span>
                  <button
                    onClick={() => deleteItem(slug, cat.id, item.id)}
                    className="text-[#ff3b6b] hover:scale-110 transition-transform"
                    aria-label="Hapus item"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              {cat.items.length === 0 && (
                <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-2">
                  Belum ada item
                </p>
              )}
            </div>

            {/* add item form */}
            <div className="border-t-2 border-[#2a2436] pt-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  type="text"
                  value={ni.name}
                  onChange={(e) => setNewItem((s) => ({ ...s, [cat.id]: { ...ni, name: e.target.value } }))}
                  placeholder="Nama item"
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                />
                <input
                  type="text"
                  value={ni.price}
                  onChange={(e) => setNewItem((s) => ({ ...s, [cat.id]: { ...ni, price: e.target.value, priceLabel: ni.priceLabel || (e.target.value ? `${e.target.value}K` : "") } }))}
                  placeholder="Harga (angka)"
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                />
                <input
                  type="text"
                  value={ni.priceLabel}
                  onChange={(e) => setNewItem((s) => ({ ...s, [cat.id]: { ...ni, priceLabel: e.target.value } }))}
                  placeholder="Label (mis. 2K)"
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                />
                <input
                  type="text"
                  value={ni.tag}
                  onChange={(e) => setNewItem((s) => ({ ...s, [cat.id]: { ...ni, tag: e.target.value } }))}
                  placeholder="Tag (opsional)"
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                />
                <input
                  type="text"
                  value={ni.description}
                  onChange={(e) => setNewItem((s) => ({ ...s, [cat.id]: { ...ni, description: e.target.value } }))}
                  placeholder="Deskripsi (opsional)"
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none sm:col-span-2"
                />
                <input
                  type="text"
                  value={ni.requirement}
                  onChange={(e) => setNewItem((s) => ({ ...s, [cat.id]: { ...ni, requirement: e.target.value } }))}
                  placeholder="Requirement (opsional)"
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                />
                <PixelButton size="sm" onClick={() => handleAddItem(cat.id)}>
                  <Plus className="size-3" /> Item
                </PixelButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
