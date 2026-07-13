"use client";
import { HelpBanner } from "@/components/admin/help-tooltip";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { Save, Download, Upload, RefreshCw } from "lucide-react";
import { AvatarCrop } from "@/components/admin/avatar-crop";
import { confirmAction } from "@/lib/confirm-modal";

export default function SettingsPage() {
  const settings = useAdminStore((s) => s.settings);
  const updateSettings = useAdminStore((s) => s.updateSettings);
  const resetAll = useAdminStore((s) => s.resetAll);
  const games = useAdminStore((s) => s.games);
  const { toast } = useToast();

  const [waNumber, setWaNumber] = useState(settings.whatsappNumber);
  const [csName, setCsName] = useState(settings.csName);
  const [csAvatar, setCsAvatar] = useState(settings.csAvatar || "");

  const handleSave = () => {
    updateSettings({ whatsappNumber: waNumber, csName: csName, csAvatar: csAvatar || undefined });
    toast({ title: "Settings disimpan!" });
  };

  const handleAvatarSave = (dataUrl: string) => {
    setCsAvatar(dataUrl);
    updateSettings({ csAvatar: dataUrl || undefined });
    toast({ title: dataUrl ? "Foto profile disimpan!" : "Foto profile dihapus!" });
  };

  const handleExport = () => {
    const data = JSON.stringify({ games, settings: { ...settings, csAvatar } }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `akuma-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast({ title: "Backup diunduh!" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.games) useAdminStore.setState({ games: data.games });
        if (data.settings) { useAdminStore.setState({ settings: data.settings }); setWaNumber(data.settings.whatsappNumber || ""); setCsName(data.settings.csName || ""); setCsAvatar(data.settings.csAvatar || ""); }
        toast({ title: "Data diimpor!" });
      } catch { toast({ title: "Gagal parse JSON", variant: "destructive" }); }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    confirmAction({
      title: "Reset SEMUA Data?",
      message: "Semua data akan dikembalikan ke default. Tidak bisa diundo.",
      variant: "danger",
      confirmLabel: "Reset Semua",
      onConfirm: () => {
        resetAll();
        toast({ title: "Data direset!" });
      },
    });
  };

  return (
    <div className="space-y-5">
      <HelpBanner title="Settings" description="Konfigurasi global website — nomor WA, nama CS, foto profile, backup/restore data." tips={["Ubah nomor WhatsApp & nama CS di sini", "Upload foto profile CS dengan crop circular", "Export JSON untuk backup, Import untuk restore", "Reset semua data jika ada masalah"]} />
      <div>
        <h1 className="text-xl font-bold text-gradient">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Konfigurasi global website.</p>
      </div>

      {/* WA & CS settings */}
      <div className="glass rounded-2xl p-5 space-y-4 max-w-2xl">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">WhatsApp & CS</h2>

        {/* Avatar crop */}
        <AvatarCrop currentAvatar={csAvatar} onSave={handleAvatarSave} label="Foto Profile CS (WA Widget)" />

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nomor WhatsApp Admin</label>
          <input type="text" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="6282131561301"
            className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40" />
          <p className="mt-1 text-[10px] text-zinc-600">Format: kode negara + nomor (tanpa + atau spasi)</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nama CS</label>
          <input type="text" value={csName} onChange={(e) => setCsName(e.target.value)}
            className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40" />
        </div>

        <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm text-white hover:from-violet-500 hover:to-violet-400 transition-all">
          <Save className="size-4" /> Simpan
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="glass rounded-2xl p-5 max-w-2xl">
        <h2 className="mb-4 text-sm font-semibold text-violet-400 uppercase tracking-wider">Backup & Restore</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-all">
            <Download className="size-4" /> Export JSON
          </button>
          <label>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 cursor-pointer transition-all">
              <Upload className="size-4" /> Import JSON
            </span>
          </label>
        </div>
        <p className="mt-3 text-[10px] text-zinc-600">Export: unduh semua data sebagai JSON. Import: upload backup untuk restore.</p>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl p-5 max-w-2xl border-red-500/20">
        <h2 className="mb-4 text-sm font-semibold text-red-400 uppercase tracking-wider">Danger Zone</h2>
        <button onClick={handleReset} className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-all">
          <RefreshCw className="size-4" /> Reset Semua Data
        </button>
        <p className="mt-3 text-[10px] text-zinc-600">Reset semua data ke default. Tidak bisa diundo.</p>
      </div>
    </div>
  );
}
