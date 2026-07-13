"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { isDeveloper } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { HelpBanner } from "@/components/admin/help-tooltip";
import { Save, Plus, Trash2, RotateCcw, Eye } from "lucide-react";
import Link from "next/link";
import { DEFAULT_ABOUT } from "@/lib/games-data";
import type { AboutContent, AboutFeature, AboutStat } from "@/lib/games-data";
import { confirmAction } from "@/lib/confirm-modal";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function AboutAdminPage() {
  const router = useRouter();
  const about = useAdminStore((s) => s.about);
  const setAbout = useAdminStore((s) => s.setAbout);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isDeveloper()) {
      toast({ title: "Akses ditolak: developer only", variant: "destructive" });
      router.replace("/admin");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthorized(true);
  }, [router, toast]);

  const [draft, setDraft] = useState<AboutContent>(about);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hydrated) setDraft(about);
  }, [hydrated, about]);

  const update = <K extends keyof AboutContent>(key: K, value: AboutContent[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const updateFeature = (id: string, patch: Partial<AboutFeature>) => {
    setDraft((d) => ({
      ...d,
      features: d.features.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
    setDirty(true);
  };

  const addFeature = () => {
    const newF: AboutFeature = { id: uid(), icon: "✨", title: "Fitur Baru", desc: "Deskripsi fitur..." };
    setDraft((d) => ({ ...d, features: [...d.features, newF] }));
    setDirty(true);
  };

  const removeFeature = (id: string) => {
    setDraft((d) => ({ ...d, features: d.features.filter((f) => f.id !== id) }));
    setDirty(true);
  };

  const updateStat = (id: string, patch: Partial<AboutStat>) => {
    setDraft((d) => ({
      ...d,
      stats: d.stats.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
    setDirty(true);
  };

  const addStat = () => {
    const newS: AboutStat = { id: uid(), label: "Label Baru", value: "0" };
    setDraft((d) => ({ ...d, stats: [...d.stats, newS] }));
    setDirty(true);
  };

  const removeStat = (id: string) => {
    setDraft((d) => ({ ...d, stats: d.stats.filter((s) => s.id !== id) }));
    setDirty(true);
  };

  const handleSave = () => {
    if (!draft.title.trim() || !draft.tagline.trim()) {
      toast({ title: "Title & tagline wajib diisi", variant: "destructive" });
      return;
    }
    setAbout(draft);
    setDirty(false);
    toast({ title: "About page disimpan & di-sync!" });
  };

  const handleReset = () => {
    confirmAction({
      title: "Reset About Page?",
      message: "Perubahan akan hilang dan dikembalikan ke default.",
      variant: "warning",
      confirmLabel: "Reset",
      onConfirm: () => {
        setDraft({ ...DEFAULT_ABOUT, updatedAt: Date.now() });
        setDirty(true);
        toast({ title: "Draft direset ke default" });
      },
    });
  };

  if (!hydrated) {
    return <div className="text-sm text-zinc-500">Loading...</div>;
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="font-pixel text-xs uppercase text-violet-400 animate-pulse">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <HelpBanner
        title="About Page"
        description="Edit konten halaman /about yang tampil ke pengunjung. Perubahan otomatis sync ke GitHub."
        tips={[
          "Title & tagline = heading utama halaman About",
          "Stats = angka pencapaian (card grid di atas)",
          "Features = 4 keunggulan utama (card grid)",
          "Description = paragraf 'Siapa Kami'",
          "Mission = paragraf misi dengan ikon target",
          "Gunakan emoji untuk icon features",
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gradient">About Page Editor</h1>
          <p className="mt-1 text-sm text-zinc-500">Konten halaman publik /about.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-all"
          >
            <Eye className="size-4" /> Preview
          </Link>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-all"
          >
            <RotateCcw className="size-4" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all disabled:opacity-50"
          >
            <Save className="size-4" /> Simpan {dirty && "●"}
          </button>
        </div>
      </div>

      {/* Hero section */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Hero Section</h2>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Title</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Tentang AKUMA JOKI"
            className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40"
          />
          <p className="mt-1 text-[10px] text-zinc-600">Kata pertama akan tampil putih, kata kedua ungu (mis: "Tentang AKUMA")</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tagline</label>
          <input
            type="text"
            value={draft.tagline}
            onChange={(e) => update("tagline", e.target.value)}
            placeholder="Joki & Store Roblox premium..."
            className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description (Siapa Kami)</label>
          <textarea
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mission</label>
          <textarea
            value={draft.mission}
            onChange={(e) => update("mission", e.target.value)}
            rows={3}
            className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40 resize-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Stats ({draft.stats.length})</h2>
          <button
            onClick={addStat}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-500/20 transition-all"
          >
            <Plus className="size-3.5" /> Add Stat
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {draft.stats.map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl p-2">
              <input
                type="text"
                value={s.value}
                onChange={(e) => updateStat(s.id, { value: e.target.value })}
                placeholder="1.500+"
                className="w-24 bg-transparent px-2 py-1 text-sm text-violet-400 font-bold outline-none border-r border-white/8"
              />
              <input
                type="text"
                value={s.label}
                onChange={(e) => updateStat(s.id, { label: e.target.value })}
                placeholder="Label"
                className="flex-1 bg-transparent px-2 py-1 text-sm text-zinc-300 outline-none"
              />
              <button
                onClick={() => removeStat(s.id)}
                className="text-red-400 hover:text-red-300 p-1"
                aria-label="Hapus"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Features ({draft.features.length})</h2>
          <button
            onClick={addFeature}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-500/20 transition-all"
          >
            <Plus className="size-3.5" /> Add Feature
          </button>
        </div>
        <div className="space-y-3">
          {draft.features.map((f) => (
            <div key={f.id} className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={f.icon}
                  onChange={(e) => updateFeature(f.id, { icon: e.target.value })}
                  placeholder="🛡️"
                  className="w-14 text-center bg-transparent px-2 py-1.5 text-lg outline-none border border-white/8 rounded-lg"
                  maxLength={4}
                />
                <input
                  type="text"
                  value={f.title}
                  onChange={(e) => updateFeature(f.id, { title: e.target.value })}
                  placeholder="Judul fitur"
                  className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40"
                />
                <button
                  onClick={() => removeFeature(f.id)}
                  className="text-red-400 hover:text-red-300 p-1.5"
                  aria-label="Hapus"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <textarea
                value={f.desc}
                onChange={(e) => updateFeature(f.id, { desc: e.target.value })}
                placeholder="Deskripsi fitur..."
                rows={2}
                className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-violet-500/40 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {dirty && (
        <div className="sticky bottom-4 glass-strong rounded-2xl p-4 border-violet-500/30 flex items-center justify-between">
          <p className="text-sm text-zinc-300">Ada perubahan belum disimpan</p>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all"
          >
            <Save className="size-4" /> Simpan Sekarang
          </button>
        </div>
      )}
    </div>
  );
}
