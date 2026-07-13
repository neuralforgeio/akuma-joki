"use client";
import { useState } from "react";
import { Webhook, Plus, Trash2, Code, Zap, Bell, GitBranch, ShoppingCart, Megaphone, Gamepad2, Star, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Hook = { id: string; url: string; event: string; active: boolean };

const WEBHOOK_KEY = "akuma-dev-webhooks";

const EVENT_META: Record<string, { label: string; icon: typeof Zap; color: string; example: string }> = {
  "order.new": {
    label: "Order Baru Masuk",
    icon: ShoppingCart,
    color: "#10b981",
    example: `{
  "event": "order.new",
  "timestamp": "2026-07-13T10:30:00Z",
  "data": {
    "orderId": "m1abc23d",
    "gameName": "Blox Fruits",
    "productName": "200 Level",
    "priceLabel": "4K",
    "username": "player123",
    "customerWA": "628xxx"
  }
}`,
  },
  "order.status": {
    label: "Status Order Berubah",
    icon: Zap,
    color: "#22d3ee",
    example: `{
  "event": "order.status",
  "timestamp": "2026-07-13T11:00:00Z",
  "data": {
    "orderId": "m1abc23d",
    "oldStatus": "new",
    "newStatus": "processing"
  }
}`,
  },
  "game.add": {
    label: "Game Baru Ditambahkan",
    icon: Gamepad2,
    color: "#a020f0",
    example: `{
  "event": "game.add",
  "timestamp": "2026-07-13T12:00:00Z",
  "data": {
    "slug": "pet-simulator",
    "name": "Pet Simulator X",
    "emoji": "🐾"
  }
}`,
  },
  "announcement.set": {
    label: "Announcement Baru",
    icon: Megaphone,
    color: "#fbbf24",
    example: `{
  "event": "announcement.set",
  "timestamp": "2026-07-13T13:00:00Z",
  "data": {
    "title": "Promo Diskon!",
    "type": "warning",
    "active": true
  }
}`,
  },
  "review.new": {
    label: "Review Baru Masuk",
    icon: Star,
    color: "#f97316",
    example: `{
  "event": "review.new",
  "timestamp": "2026-07-13T14:00:00Z",
  "data": {
    "reviewId": "rev123",
    "gameName": "Blox Fruits",
    "customerName": "PlayerOne",
    "rating": 5,
    "comment": "Pelayanan cepat!"
  }
}`,
  },
  "deploy.success": {
    label: "Deploy Vercel Sukses",
    icon: GitBranch,
    color: "#10b981",
    example: `{
  "event": "deploy.success",
  "timestamp": "2026-07-13T15:00:00Z",
  "data": {
    "url": "akuma-joki.vercel.app",
    "commit": "feat: add new feature",
    "state": "READY"
  }
}`,
  },
};

export default function DevWebhooksPage() {
  const { toast } = useToast();
  const [hooks, setHooks] = useState<Hook[]>(() => {
    try { return JSON.parse(localStorage.getItem(WEBHOOK_KEY) || "[]"); } catch { return []; }
  });
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("order.new");
  const [showExample, setShowExample] = useState<string | null>(null);

  const save = (h: Hook[]) => { setHooks(h); localStorage.setItem(WEBHOOK_KEY, JSON.stringify(h)); };
  const add = () => {
    if (!url.trim()) { toast({ title: "URL wajib diisi", variant: "destructive" }); return; }
    try { new URL(url.trim()); } catch { toast({ title: "URL tidak valid", variant: "destructive" }); return; }
    save([...hooks, { id: Date.now().toString(36), url: url.trim(), event, active: true }]);
    setUrl("");
    toast({ title: "Webhook ditambahkan!" });
  };
  const toggle = (id: string) => save(hooks.map(h => h.id === id ? { ...h, active: !h.active } : h));
  const remove = (id: string) => save(hooks.filter(h => h.id !== id));

  const copyExample = (example: string) => {
    try { navigator.clipboard.writeText(example); toast({ title: "Contoh payload disalin!" }); } catch {}
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gradient">Webhooks</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kirim notifikasi ke URL external (Discord, Slack, Telegram bot, dll) saat event tertentu terjadi.
        </p>
      </div>

      {/* Penjelasan Webhook */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="size-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Apa itu Webhook?</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed mb-3">
          Webhook adalah cara untuk membuat aplikasi lain tahu ketika sesuatu terjadi di AKUMA JOKI.
          Saat event (mis. order baru) terjadi, sistem akan mengirim <code className="px-1 py-0.5 rounded bg-white/5 text-cyan-400 font-mono text-xs">POST</code> request
          ke URL yang Anda daftarkan, berisi data event dalam format JSON.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="glass rounded-xl p-3">
            <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-2">Contoh Penggunaan</p>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li>📨 <span className="text-zinc-200">Discord notification</span> — kirim pesan ke channel Discord saat order baru masuk</li>
              <li>💼 <span className="text-zinc-200">Slack integration</span> — notif tim di Slack saat ada review baru</li>
              <li>🤖 <span className="text-zinc-200">Telegram Bot</span> — forward order ke bot Telegram admin</li>
              <li>📧 <span className="text-zinc-200">Email automation</span> — trigger email via Zapier/Make.com</li>
              <li>📊 <span className="text-zinc-200">Analytics</span> — log event ke Google Sheets / database</li>
            </ul>
          </div>
          <div className="glass rounded-xl p-3">
            <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-2">Cara Setup</p>
            <ol className="space-y-1.5 text-xs text-zinc-400 list-decimal list-inside">
              <li>Buat webhook receiver (mis. Discord channel webhook URL)</li>
              <li>Paste URL ke form di bawah</li>
              <li>Pilih event yang ingin dipantau</li>
              <li>Klik "Add" — webhook aktif</li>
              <li>Saat event trigger, POST request otomatis dikirim</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Events reference */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Code className="size-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Event Types & Payload Examples</h2>
        </div>
        <div className="space-y-2">
          {Object.entries(EVENT_META).map(([key, meta]) => {
            const Icon = meta.icon;
            const isExpanded = showExample === key;
            return (
              <div key={key} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowExample(isExpanded ? null : key)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/3 transition-colors text-left"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: meta.color + "40", backgroundColor: meta.color + "10" }}>
                    <Icon className="size-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-100 font-mono">{key}</p>
                    <p className="text-[10px] text-zinc-500">{meta.label}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600">{isExpanded ? "Hide" : "Show"} payload</span>
                </button>
                {isExpanded && (
                  <div className="border-t border-white/5 p-3 bg-black/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase text-zinc-500 tracking-wider">POST body (JSON)</p>
                      <button
                        onClick={() => copyExample(meta.example)}
                        className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-cyan-400"
                      >
                        <Copy className="size-3" /> Copy
                      </button>
                    </div>
                    <pre className="bg-black/40 rounded-lg p-3 text-[11px] text-green-400 font-mono overflow-x-auto">{meta.example}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add webhook form */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Webhook className="size-4 text-cyan-400" />
          <span className="text-sm text-zinc-300">Add Webhook</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/... atau https://hooks.slack.com/..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-cyan-500/40"
          />
          <select
            value={event}
            onChange={e => setEvent(e.target.value)}
            className="bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-cyan-500/40"
          >
            {Object.entries(EVENT_META).map(([key, meta]) => (
              <option key={key} value={key} className="bg-[#0a0a0a]">{key} — {meta.label}</option>
            ))}
          </select>
          <button
            onClick={add}
            className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/30"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>
      </div>

      {/* Webhook list */}
      <div className="space-y-2">
        {hooks.map(h => {
          const meta = EVENT_META[h.event];
          const Icon = meta?.icon || Webhook;
          return (
            <div key={h.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <button
                onClick={() => toggle(h.id)}
                className={cn("h-3 w-3 rounded-full transition-colors", h.active ? "bg-green-400" : "bg-zinc-600")}
                aria-label={h.active ? "Active" : "Inactive"}
              />
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", meta ? "" : "border-white/10 bg-white/5")}
                style={meta ? { borderColor: meta.color + "40", backgroundColor: meta.color + "10" } : {}}
              >
                <Icon className={cn("size-4", meta ? "" : "text-zinc-400")} style={meta ? { color: meta.color } : {}} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{h.url}</p>
                <p className="text-xs text-zinc-500">{h.event} {meta && `· ${meta.label}`}</p>
              </div>
              <button onClick={() => remove(h.id)} className="text-red-400 hover:text-red-300 p-1" aria-label="Hapus">
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        {hooks.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <Webhook className="mx-auto size-10 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">Belum ada webhook configured</p>
            <p className="text-[10px] text-zinc-600 mt-1">Tambahkan URL webhook di atas untuk mulai terima notifikasi event</p>
          </div>
        )}
      </div>
    </div>
  );
}
