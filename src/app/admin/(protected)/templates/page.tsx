"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Trash2, Save } from "lucide-react";

export default function TemplatesPage() {
  const waReplies = useAdminStore((s) => s.waReplies);
  const setWAReplies = useAdminStore((s) => s.setWAReplies);
  const { toast } = useToast();
  const [replies, setReplies] = useState(
    waReplies.length > 0
      ? waReplies
      : [
          { label: "Cek Harga Joki", emoji: "💰", kind: "auto" as const, autoKey: "price-all", reply: "" },
          { label: "Cara Order", emoji: "🚀", kind: "auto" as const, autoKey: "cara-order", reply: "🚀 CARA ORDER:\n1. Pilih game\n2. Klik joki\n3. Checkout\n4. Bayar via WA" },
          { label: "Status Pesanan", emoji: "📦", kind: "auto" as const, autoKey: "status", reply: "📦 Beritahu kami Order ID untuk cek status." },
          { label: "Jam Operasional", emoji: "🕐", kind: "auto" as const, autoKey: "hours", reply: "🕐 Online 09.00-23.00 WIB setiap hari." },
          { label: "Chat Admin", emoji: "👤", kind: "redirect" as const },
        ]
  );

  const handleSave = () => {
    setWAReplies(replies);
    toast({ title: "Templates disimpan!" });
  };

  const addReply = () => {
    setReplies([...replies, { label: "Menu Baru", emoji: "✨", kind: "auto", autoKey: "custom", reply: "" }]);
  };

  const updateReply = (i: number, field: string, value: string) => {
    setReplies(replies.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const deleteReply = (i: number) => {
    setReplies(replies.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
            WHATSAPP TEMPLATES
          </h1>
          <p className="mt-1 text-sm text-[#9a93a8]">
            Edit template quick-reply di widget WhatsApp.
          </p>
        </div>
        <PixelButton size="sm" onClick={addReply}>
          <Plus className="size-3.5" /> Tambah
        </PixelButton>
      </div>

      <div className="space-y-3">
        {replies.map((r, i) => (
          <div key={i} className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="text"
                value={r.emoji}
                onChange={(e) => updateReply(i, "emoji", e.target.value)}
                className="w-12 bg-[#0a0a0a] border-2 border-[#2a2436] text-[#e5e5e5] px-2 py-2 text-center text-lg pixel-corner outline-none focus:border-[#a020f0]"
              />
              <input
                type="text"
                value={r.label}
                onChange={(e) => updateReply(i, "label", e.target.value)}
                className="flex-1 bg-[#0a0a0a] border-2 border-[#2a2436] text-[#e5e5e5] px-3 py-2 text-sm pixel-corner outline-none focus:border-[#a020f0]"
              />
              <select
                value={r.kind}
                onChange={(e) => updateReply(i, "kind", e.target.value)}
                className="bg-[#0a0a0a] border-2 border-[#2a2436] text-[#e5e5e5] px-2 py-2 text-xs pixel-corner outline-none focus:border-[#a020f0]"
              >
                <option value="auto">⚡ Auto-reply</option>
                <option value="redirect">📱 Redirect WA</option>
              </select>
              <button
                onClick={() => deleteReply(i)}
                className="flex items-center justify-center border-2 border-[#ff3b6b]/40 text-[#ff3b6b] px-2 py-2 pixel-corner hover:bg-[#ff3b6b]/10"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            {r.kind === "auto" && (
              <textarea
                value={r.reply || ""}
                onChange={(e) => updateReply(i, "reply", e.target.value)}
                rows={2}
                placeholder="Isi auto-reply..."
                className="w-full bg-[#0a0a0a] border-2 border-[#2a2436] text-[#e5e5e5] px-3 py-2 text-xs pixel-corner outline-none focus:border-[#a020f0] resize-none"
              />
            )}
          </div>
        ))}
      </div>

      <PixelButton size="sm" onClick={handleSave}>
        <Save className="size-3" /> Simpan Semua
      </PixelButton>
    </div>
  );
}
