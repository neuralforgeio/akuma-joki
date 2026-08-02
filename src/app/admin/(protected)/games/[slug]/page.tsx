"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Save, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { confirmAction } from "@/lib/confirm-modal";
import type { ProductItem } from "@/lib/games-data";

type Difficulty = "easy" | "medium" | "hard" | "expert";

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: "Easy", color: "#6ee7b7" },
  medium: { label: "Medium", color: "#ffd166" },
  hard: { label: "Hard", color: "#fb923c" },
  expert: { label: "Expert", color: "#ff3b6b" },
};

const PROMO_TAG_EXAMPLES = ["Hot", "Popular", "Starter", "Legendary", "New", "Sale"];

type NewItemForm = {
  name: string;
  price: string;
  priceLabel: string;
  tag: string;
  difficulty: "" | Difficulty;
  description: string;
  requirement: string;
};

type EditItemForm = {
  name: string;
  price: string;
  priceLabel: string;
  tag: string;
  difficulty: "" | Difficulty;
  description: string;
  requirement: string;
};

const EMPTY_NEW_ITEM: NewItemForm = {
  name: "",
  price: "",
  priceLabel: "",
  tag: "",
  difficulty: "",
  description: "",
  requirement: "",
};

export default function EditGamePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const game = useAdminStore((s) => s.games.find((g) => g.slug === slug));
  const updateGame = useAdminStore((s) => s.updateGame);
  const addCategory = useAdminStore((s) => s.addCategory);
  const deleteCategory = useAdminStore((s) => s.deleteCategory);
  const addItem = useAdminStore((s) => s.addItem);
  const updateItem = useAdminStore((s) => s.updateItem);
  const deleteItem = useAdminStore((s) => s.deleteItem);
  const createCommit = useAdminStore((s) => s.createCommit);
  const { toast } = useToast();

  const [editForm, setEditForm] = useState(
    game
      ? { name: game.name, tagline: game.tagline, description: game.description, emoji: game.emoji, accent: game.accent }
      : null
  );
  const [newCat, setNewCat] = useState({ name: "", icon: "📈" });
  const [newItem, setNewItem] = useState<Record<string, NewItemForm>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState<EditItemForm | null>(null);

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
    const payload: Omit<ProductItem, "id"> = {
      name: item.name,
      price: parseInt(item.price || "0", 10),
      priceLabel: item.priceLabel || `${item.price}K`,
      tag: item.tag || undefined,
      difficulty: item.difficulty || undefined,
      description: item.description || undefined,
      requirement: item.requirement || undefined,
    };
    addItem(slug, catId, { id, ...payload });
    setNewItem((s) => ({ ...s, [catId]: { ...EMPTY_NEW_ITEM } }));
    toast({ title: "Item ditambahkan!" });
  };

  const startEditItem = (item: ProductItem) => {
    setEditingItemId(item.id);
    setEditItemForm({
      name: item.name,
      price: String(item.price ?? ""),
      priceLabel: item.priceLabel ?? "",
      tag: item.tag ?? "",
      difficulty: item.difficulty ?? "",
      description: item.description ?? "",
      requirement: item.requirement ?? "",
    });
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditItemForm(null);
  };

  const saveEditItem = (catId: string, itemId: string) => {
    if (!editItemForm) return;
    const parsedPrice = parseInt(editItemForm.price || "0", 10);
    updateItem(slug, catId, itemId, {
      name: editItemForm.name,
      price: Number.isNaN(parsedPrice) ? 0 : parsedPrice,
      priceLabel: editItemForm.priceLabel || `${editItemForm.price}K`,
      tag: editItemForm.tag || undefined,
      difficulty: editItemForm.difficulty || undefined,
      description: editItemForm.description || undefined,
      requirement: editItemForm.requirement || undefined,
    });
    setEditingItemId(null);
    setEditItemForm(null);
    toast({ title: "Item diupdate!" });
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

      {/* promo tag legend */}
      <div className="border-2 border-[#2a2436] bg-[#0a0a0a]/60 pixel-corner p-4">
        <p className="font-pixel text-[7px] uppercase text-[#9a93a8] mb-2">
          Suggested Promo Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROMO_TAG_EXAMPLES.map((t) => (
            <span
              key={t}
              className="font-pixel text-[7px] uppercase px-2 py-1 bg-[#a020f0]/15 text-[#c44bff] border border-[#a020f0]/30 pixel-corner"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[#5a5266]">
          Gunakan salah satu tag di atas supaya dapat badge promo yang menyala di store.
          Biarkan kosong jika tidak perlu.
        </p>
      </div>

      {/* categories + items */}
      {game.categories.map((cat) => {
        const ni = newItem[cat.id] ?? { ...EMPTY_NEW_ITEM };
        return (
          <div key={cat.id} className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">
                {cat.icon} {cat.name}
              </h3>
              <button
                onClick={() => {
                  confirmAction({
                    title: "Hapus Kategori?",
                    message: `Kategori ${cat.name} akan dihapus permanen beserta semua item di dalamnya.`,
                    variant: "danger",
                    confirmLabel: "Hapus",
                    onConfirm: () => deleteCategory(slug, cat.id),
                  });
                }}
                className="flex items-center gap-1 font-pixel text-[7px] uppercase text-[#ff3b6b] border-2 border-[#ff3b6b]/40 px-2 py-1 pixel-corner hover:bg-[#ff3b6b]/10"
              >
                <Trash2 className="size-3" /> Hapus
              </button>
            </div>

            {/* items list */}
            <div className="space-y-2 mb-4">
              {cat.items.map((item) => {
                const isEditing = editingItemId === item.id;
                if (isEditing && editItemForm) {
                  return (
                    <div
                      key={item.id}
                      className="border-2 border-[#a020f0]/50 bg-[#0a0a0a] pixel-corner px-3 py-3"
                    >
                      <p className="font-pixel text-[7px] uppercase text-[#c44bff] mb-2">
                        Edit: {item.name}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <input
                          type="text"
                          value={editItemForm.name}
                          onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
                          placeholder="Nama item"
                          className="bg-[#121017] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                        />
                        <input
                          type="text"
                          value={editItemForm.price}
                          onChange={(e) =>
                            setEditItemForm({
                              ...editItemForm,
                              price: e.target.value,
                              priceLabel:
                                editItemForm.priceLabel || (e.target.value ? `${e.target.value}K` : ""),
                            })
                          }
                          placeholder="Harga (angka)"
                          className="bg-[#121017] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                        />
                        <input
                          type="text"
                          value={editItemForm.priceLabel}
                          onChange={(e) =>
                            setEditItemForm({ ...editItemForm, priceLabel: e.target.value })
                          }
                          placeholder="Label (mis. 2K)"
                          className="bg-[#121017] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                        />
                        <select
                          value={editItemForm.difficulty}
                          onChange={(e) =>
                            setEditItemForm({
                              ...editItemForm,
                              difficulty: e.target.value as EditItemForm["difficulty"],
                            })
                          }
                          className="bg-[#121017] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                        >
                          <option value="">Difficulty: Auto</option>
                          <option value="easy">Difficulty: Easy</option>
                          <option value="medium">Difficulty: Medium</option>
                          <option value="hard">Difficulty: Hard</option>
                          <option value="expert">Difficulty: Expert</option>
                        </select>
                        <input
                          type="text"
                          value={editItemForm.tag}
                          onChange={(e) => setEditItemForm({ ...editItemForm, tag: e.target.value })}
                          placeholder="Promo Tag (mis. Hot, Popular)"
                          className="bg-[#121017] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                        />
                        <input
                          type="text"
                          value={editItemForm.description}
                          onChange={(e) =>
                            setEditItemForm({ ...editItemForm, description: e.target.value })
                          }
                          placeholder="Deskripsi (opsional)"
                          className="bg-[#121017] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                        />
                        <input
                          type="text"
                          value={editItemForm.requirement}
                          onChange={(e) =>
                            setEditItemForm({ ...editItemForm, requirement: e.target.value })
                          }
                          placeholder="Requirement (opsional)"
                          className="bg-[#121017] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => saveEditItem(cat.id, item.id)}
                            className="flex items-center gap-1 font-pixel text-[7px] uppercase text-[#6ee7b7] border-2 border-[#6ee7b7]/40 px-2 py-1 pixel-corner hover:bg-[#6ee7b7]/10"
                            aria-label="Simpan perubahan"
                          >
                            <Check className="size-3" /> Simpan
                          </button>
                          <button
                            onClick={cancelEditItem}
                            className="flex items-center gap-1 font-pixel text-[7px] uppercase text-[#9a93a8] border-2 border-[#2a2436] px-2 py-1 pixel-corner hover:bg-white/5"
                            aria-label="Batal edit"
                          >
                            <X className="size-3" /> Batal
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 sm:gap-3 border border-[#2a2436] bg-[#0a0a0a] pixel-corner px-3 py-2"
                  >
                    <span className="text-[#9a93a8]">•</span>
                    <span className="text-sm text-[#e5e5e5] flex-1 truncate">{item.name}</span>
                    {item.tag && (
                      <span className="font-pixel text-[6px] uppercase px-1.5 py-0.5 bg-[#a020f0]/20 text-[#c44bff] pixel-corner">
                        {item.tag}
                      </span>
                    )}
                    {item.difficulty && (
                      <span
                        className="font-pixel text-[6px] uppercase px-1.5 py-0.5 pixel-corner"
                        style={{
                          color: DIFFICULTY_META[item.difficulty].color,
                          background: `${DIFFICULTY_META[item.difficulty].color}1a`,
                          border: `1px solid ${DIFFICULTY_META[item.difficulty].color}55`,
                        }}
                      >
                        {DIFFICULTY_META[item.difficulty].label}
                      </span>
                    )}
                    <span className="font-pixel text-[8px] text-[#c44bff]">{item.priceLabel}</span>
                    <button
                      onClick={() => startEditItem(item)}
                      className="text-[#9a93a8] hover:text-[#c44bff] transition-colors"
                      aria-label="Edit item"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      onClick={() => deleteItem(slug, cat.id, item.id)}
                      className="text-[#ff3b6b] hover:scale-110 transition-transform"
                      aria-label="Hapus item"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                );
              })}
              {cat.items.length === 0 && (
                <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-2">
                  Belum ada item
                </p>
              )}
            </div>

            {/* add item form */}
            <div className="border-t-2 border-[#2a2436] pt-3">
              <p className="font-pixel text-[7px] uppercase text-[#9a93a8] mb-2">Tambah Item Baru</p>
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
                  onChange={(e) =>
                    setNewItem((s) => ({
                      ...s,
                      [cat.id]: {
                        ...ni,
                        price: e.target.value,
                        priceLabel: ni.priceLabel || (e.target.value ? `${e.target.value}K` : ""),
                      },
                    }))
                  }
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
                <select
                  value={ni.difficulty}
                  onChange={(e) =>
                    setNewItem((s) => ({
                      ...s,
                      [cat.id]: { ...ni, difficulty: e.target.value as NewItemForm["difficulty"] },
                    }))
                  }
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
                  aria-label="Difficulty"
                >
                  <option value="">Difficulty: Auto</option>
                  <option value="easy">Difficulty: Easy</option>
                  <option value="medium">Difficulty: Medium</option>
                  <option value="hard">Difficulty: Hard</option>
                  <option value="expert">Difficulty: Expert</option>
                </select>
                <input
                  type="text"
                  value={ni.tag}
                  onChange={(e) => setNewItem((s) => ({ ...s, [cat.id]: { ...ni, tag: e.target.value } }))}
                  placeholder="Promo Tag (mis. Hot, Popular, Legendary)"
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none sm:col-span-2"
                />
                <input
                  type="text"
                  value={ni.description}
                  onChange={(e) => setNewItem((s) => ({ ...s, [cat.id]: { ...ni, description: e.target.value } }))}
                  placeholder="Deskripsi (opsional)"
                  className="bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none"
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
