"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

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
          { label: "Jam Operasional", emoji: "🕐", kind: "auto" as const, autoKey: "hours", reply: "🕐 Online 13.00-21.00 WIB setiap hari." },
          { label: "Chat Admin", emoji: "👤", kind: "redirect" as const },
        ]
  );

  const handleSave = () => { setWAReplies(replies); toast({ title: "Templates disimpan!" }); };
  const addReply = () => { setReplies([...replies, { label: "Menu Baru", emoji: "✨", kind: "auto", autoKey: "custom", reply: "" }]); };
  const updateReply = (i: number, field: string, value: string) => { setReplies(replies.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))); };
  const deleteReply = (i: number) => { setReplies(replies.filter((_, idx) => idx !== i)); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gradient">WhatsApp Templates</h1>
          <p className="mt-1 text-sm text-zinc-500">Edit template quick-reply di widget WhatsApp.</p>
        </div>
        <button onClick={addReply} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-2 text-xs font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all">
          <Plus className="size-3.5" /> Tambah
        </button>
      </div>

      {/* Template cards */}
      <div className="space-y-3">
        {replies.map((r, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-3">
            {/* Row 1: emoji + label (mobile: stacked, desktop: inline) */}
            <div className="flex items-start gap-2.5">
              <input type="text" value={r.emoji} onChange={(e) => updateReply(i, "emoji", e.target.value)}
                className="w-12 shrink-0 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-lg outline-none focus:border-violet-500/40" />
              <input type="text" value={r.label} onChange={(e) => updateReply(i, "label", e.target.value)}
                className="min-w-0 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/40" />
            </div>

            {/* Row 2: kind select + delete (mobile: side by side, full width) */}
            <div className="flex items-center gap-2">
              <select value={r.kind} onChange={(e) => updateReply(i, "kind", e.target.value)}
                className="min-w-0 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/40">
                <option value="auto">⚡ Auto-reply</option>
                <option value="redirect">📱 Redirect WA</option>
              </select>
              <button onClick={() => deleteReply(i)} aria-label="Hapus template"
                className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>

            {/* Row 3: reply text (only for auto) */}
            {r.kind === "auto" && (
              <textarea value={r.reply || ""} onChange={(e) => updateReply(i, "reply", e.target.value)} rows={3}
                placeholder="Isi auto-reply..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/40 resize-none" />
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm font-medium text-white hover:from-violet-500 hover:to-violet-400 transition-all">
        <Save className="size-4" /> Simpan Semua
      </button>
    </div>
  );
}
