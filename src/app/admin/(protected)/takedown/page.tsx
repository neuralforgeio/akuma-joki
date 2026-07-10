"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { Power, AlertTriangle, Save } from "lucide-react";

export default function TakedownPage() {
  const takedown = useAdminStore((s) => s.takedown);
  const takedownReason = useAdminStore((s) => s.takedownReason);
  const setTakedown = useAdminStore((s) => s.setTakedown);
  const createCommit = useAdminStore((s) => s.createCommit);
  const { toast } = useToast();
  const [reason, setReason] = useState(takedownReason);

  const handleToggle = () => {
    const newState = !takedown;
    setTakedown(newState, reason);
    createCommit(`Takedown ${newState ? "ON" : "OFF"}`, "admin");
    toast({
      title: newState ? "Takedown AKTIF" : "Website LIVE",
      description: newState ? "Visitor akan dialihkan ke halaman maintenance." : "Website normal kembali.",
      variant: newState ? "destructive" : "default",
    });
  };

  const handleSaveReason = () => {
    setTakedown(takedown, reason);
    toast({ title: "Alasan disimpan" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          TAKEDOWN CONTROL
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">
          Aktifkan mode maintenance untuk menonaktifkan website sementara.
        </p>
      </div>

      {/* status card */}
      <div
        className={`border-2 pixel-corner p-6 ${
          takedown
            ? "border-[#ff3b6b] bg-[#ff3b6b]/10 shadow-[0_0_20px_rgba(255,59,107,0.3)]"
            : "border-[#6ee7b7] bg-[#6ee7b7]/10 shadow-[0_0_20px_rgba(110,231,183,0.2)]"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center border-2 pixel-corner ${
              takedown ? "border-[#ff3b6b]" : "border-[#6ee7b7]"
            }`}
          >
            <Power className={`size-7 ${takedown ? "text-[#ff3b6b]" : "text-[#6ee7b7]"}`} />
          </div>
          <div>
            <p className={`font-pixel text-sm ${takedown ? "text-[#ff3b6b]" : "text-[#6ee7b7]"}`}>
              {takedown ? "MAINTENANCE MODE" : "WEBSITE LIVE"}
            </p>
            <p className="text-xs text-[#9a93a8] mt-1">
              {takedown
                ? "Semua route redirect ke halaman takedown."
                : "Website berjalan normal."}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <PixelButton
            size="lg"
            variant={takedown ? "silver" : "danger"}
            onClick={handleToggle}
            className="w-full"
          >
            <Power className="size-4" />
            {takedown ? "MATIKAN TAKEDOWN" : "AKTIFKAN TAKEDOWN"}
          </PixelButton>
        </div>
      </div>

      {/* reason editor */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5 space-y-4 max-w-2xl">
        <h2 className="font-pixel text-[9px] uppercase text-[#c44bff]">Alasan Maintenance</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-3 text-sm pixel-corner outline-none resize-none"
        />
        <PixelButton size="sm" onClick={handleSaveReason}>
          <Save className="size-3" /> Simpan Alasan
        </PixelButton>
      </div>

      {/* warning notice */}
      <div className="border-2 border-[#ffd166]/40 bg-[#ffd166]/5 pixel-corner p-4 flex items-start gap-3">
        <AlertTriangle className="size-4 text-[#ffd166] shrink-0 mt-0.5" />
        <div>
          <p className="font-pixel text-[8px] uppercase text-[#ffd166] mb-1">Catatan</p>
          <p className="text-xs text-[#bcb4c9] leading-relaxed">
            Takedown via dashboard bersifat per-browser (localStorage + cookie).
            Untuk takedown global semua visitor, ubah <code className="text-[#c44bff]">config.json</code> di kode
            dan redeploy. Dashboard takedown cocok untuk preview/test maintenance.
          </p>
        </div>
      </div>
    </div>
  );
}
