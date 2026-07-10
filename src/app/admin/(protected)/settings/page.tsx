"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Download, Upload, RefreshCw, MessageCircle } from "lucide-react";

export default function SettingsPage() {
  const settings = useAdminStore((s) => s.settings);
  const updateSettings = useAdminStore((s) => s.updateSettings);
  const resetAll = useAdminStore((s) => s.resetAll);
  const games = useAdminStore((s) => s.games);
  const { toast } = useToast();

  const [waNumber, setWaNumber] = useState(settings.whatsappNumber);
  const [csName, setCsName] = useState(settings.csName);

  const handleSave = () => {
    updateSettings({ whatsappNumber: waNumber, csName: csName });
    toast({ title: "Settings disimpan!" });
  };

  const handleExport = () => {
    const data = JSON.stringify({ games, settings }, null, 2);
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
        if (data.games && Array.isArray(data.games)) {
          // import games via store
          useAdminStore.setState({ games: data.games });
          if (data.settings) useAdminStore.setState({ settings: data.settings });
          toast({ title: "Data diimpor!" });
        } else {
          toast({ title: "Format tidak valid", variant: "destructive" });
        }
      } catch {
        toast({ title: "Gagal parse JSON", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm("Reset SEMUA data ke default? Games, announcement, orders, dll akan direset.")) {
      resetAll();
      toast({ title: "Data direset ke default!" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          SETTINGS
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">Konfigurasi global website.</p>
      </div>

      {/* WA settings */}
      <div className="border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner p-5 space-y-4 max-w-2xl">
        <h2 className="font-pixel text-[9px] uppercase text-[#c44bff]">WhatsApp & CS</h2>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Nomor WhatsApp Admin</label>
          <input
            type="text"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="6282131561301"
            className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none"
          />
          <p className="mt-1 font-pixel text-[6px] text-[#5a5266]">
            Format: kode negara + nomor (tanpa + atau spasi)
          </p>
        </div>
        <div>
          <label className="font-pixel text-[8px] uppercase text-[#9a93a8]">Nama CS</label>
          <input
            type="text"
            value={csName}
            onChange={(e) => setCsName(e.target.value)}
            className="mt-2 w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none"
          />
        </div>
        <PixelButton size="sm" onClick={handleSave}>
          <Save className="size-3" /> Simpan
        </PixelButton>
      </div>

      {/* backup & restore */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5 max-w-2xl">
        <h2 className="mb-4 font-pixel text-[9px] uppercase text-[#c44bff]">Backup & Restore</h2>
        <div className="flex flex-wrap gap-3">
          <PixelButton size="sm" variant="silver" onClick={handleExport}>
            <Download className="size-3" /> Export JSON
          </PixelButton>
          <label>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <span className="inline-flex items-center gap-2 font-pixel text-[8px] uppercase text-[#e5e5e5] border-2 border-[#2a2436] hover:border-[#a020f0] hover:text-[#c44bff] px-4 py-3 pixel-corner cursor-pointer transition-all">
              <Upload className="size-3" /> Import JSON
            </span>
          </label>
        </div>
        <p className="mt-3 font-pixel text-[6px] text-[#5a5266] leading-relaxed">
          Export: unduh semua data games + settings sebagai JSON. Import: upload backup JSON untuk restore.
        </p>
      </div>

      {/* danger zone */}
      <div className="border-2 border-[#ff3b6b]/40 bg-[#ff3b6b]/5 pixel-corner p-5 max-w-2xl">
        <h2 className="mb-4 font-pixel text-[9px] uppercase text-[#ff3b6b]">Danger Zone</h2>
        <PixelButton size="sm" variant="danger" onClick={handleReset}>
          <RefreshCw className="size-3" /> Reset Semua Data
        </PixelButton>
        <p className="mt-3 font-pixel text-[6px] text-[#9a93a8] leading-relaxed">
          Reset semua data (games, announcement, orders, commits, dll) ke default. Tidak bisa diundo.
        </p>
      </div>
    </div>
  );
}
