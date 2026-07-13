"use client";
import { HelpBanner } from "@/components/admin/help-tooltip";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Save, Trash2, Eye } from "lucide-react";

export default function AnnouncementPage() {
  const announcement = useAdminStore((s) => s.announcement);
  const setAnnouncement = useAdminStore((s) => s.setAnnouncement);
  const createCommit = useAdminStore((s) => s.createCommit);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: announcement?.title ?? "",
    body: announcement?.body ?? "",
    type: announcement?.type ?? "info" as "info" | "warning" | "success",
    active: announcement?.active ?? true,
  });

  const handleSave = () => {
    if (!form.title || !form.body) {
      toast({ title: "Lengkapi judul & body", variant: "destructive" });
      return;
    }
    setAnnouncement({
      id: announcement?.id ?? Date.now().toString(36),
      title: form.title,
      body: form.body,
      type: form.type,
      active: form.active,
      createdAt: announcement?.createdAt ?? Date.now(),
    });
    createCommit(`Update announcement: ${form.title}`, "admin");
    toast({ title: "Announcement disimpan!" });
  };

  const handleClear = () => {
    setAnnouncement(null);
    toast({ title: "Announcement dihapus" });
  };

  const typeColor =
    form.type === "warning" ? "#ff3b6b" : form.type === "success" ? "#6ee7b7" : "#7fd4ff";

  return (
    <div className="space-y-6">
      <HelpBanner title="Announcement" description="Banner global yang muncul di semua halaman public. User bisa dismiss per session." tips={["Pilih tipe: info (biru), warning (merah), success (hijau)", "Centang 'Aktif' untuk menampilkan banner", "Announcement otomatis sync ke GitHub & Vercel redeploys"]} />
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          ANNOUNCEMENT
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">
          Banner global yang muncul di semua halaman public.
        </p>
      </div>

      {/* preview */}
      {form.active && form.title && (
        <div className="border-2 pixel-corner p-4" style={{ borderColor: `${typeColor}66`, background: `${typeColor}11` }}>
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="size-4" style={{ color: typeColor }} />
            <span className="font-pixel text-[9px] uppercase" style={{ color: typeColor }}>
              {form.title}
            </span>
          </div>
          <p className="text-sm text-[#e5e5e5]">{form.body}</p>
          <p className="font-pixel text-[6px] uppercase text-[#9a93a8] mt-2 flex items-center gap-1">
            <Eye className="size-2.5" /> Preview live
          </p>
        </div>
      )}

      {/* form */}
      <div className="border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner p-5 space-y-4 max-w-2xl">
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Judul</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Mis. Promo Akhir Tahun!"
            className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none"
          />
        </div>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Body</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Detail announcement..."
            rows={3}
            className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none resize-none"
          />
        </div>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Tipe</label>
          <div className="mt-2 flex gap-2">
            {(["info", "warning", "success"] as const).map((t) => {
              const c = t === "warning" ? "#ff3b6b" : t === "success" ? "#6ee7b7" : "#7fd4ff";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className="flex items-center gap-2 border-2 pixel-corner px-3 py-2 font-pixel text-[7px] uppercase transition-all"
                  style={{
                    borderColor: form.type === t ? c : "#2a2436",
                    background: form.type === t ? `${c}22` : "transparent",
                    color: form.type === t ? c : "#9a93a8",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="sr-only"
          />
          <span
            className={`flex h-5 w-5 items-center justify-center border-2 pixel-corner transition-colors ${
              form.active ? "bg-[#a020f0] border-[#a020f0]" : "border-[#a020f0]/50"
            }`}
          >
            {form.active && <span className="text-white text-[10px]">✓</span>}
          </span>
          <span className="text-sm text-[#bcb4c9]">Aktif (tampilkan di website)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <PixelButton size="sm" onClick={handleSave}>
            <Save className="size-3" /> Simpan
          </PixelButton>
          <PixelButton size="sm" variant="silver" onClick={handleClear}>
            <Trash2 className="size-3" /> Hapus
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
