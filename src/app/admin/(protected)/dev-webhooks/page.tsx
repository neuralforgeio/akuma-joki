"use client";
import { useState } from "react";
import { Webhook, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Hook = { id: string; url: string; event: string; active: boolean };

const WEBHOOK_KEY = "akuma-dev-webhooks";

export default function DevWebhooksPage() {
  const { toast } = useToast();
  const [hooks, setHooks] = useState<Hook[]>(() => {
    try { return JSON.parse(localStorage.getItem(WEBHOOK_KEY) || "[]"); } catch { return []; }
  });
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("order.new");

  const save = (h: Hook[]) => { setHooks(h); localStorage.setItem(WEBHOOK_KEY, JSON.stringify(h)); };
  const add = () => { if (!url.trim()) return; save([...hooks, { id: Date.now().toString(36), url: url.trim(), event, active: true }]); setUrl(""); toast({ title: "Webhook added!" }); };
  const toggle = (id: string) => save(hooks.map(h => h.id === id ? { ...h, active: !h.active } : h));
  const remove = (id: string) => save(hooks.filter(h => h.id !== id));

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-gradient">Webhooks</h1><p className="mt-1 text-sm text-zinc-500">Setup webhook untuk event tertentu (dev feature, pure frontend demo).</p></div>
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2"><Webhook className="size-4 text-cyan-400" /><span className="text-sm text-zinc-300">Add Webhook</span></div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500/40" />
          <select value={event} onChange={e => setEvent(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none">
            <option value="order.new">order.new</option><option value="order.status">order.status</option><option value="game.add">game.add</option><option value="announcement.set">announcement.set</option>
          </select>
          <button onClick={add} className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/30"><Plus className="size-4" /> Add</button>
        </div>
      </div>
      <div className="space-y-2">
        {hooks.map(h => (
          <div key={h.id} className="glass rounded-2xl p-3 flex items-center gap-3">
            <button onClick={() => toggle(h.id)} className={`h-3 w-3 rounded-full ${h.active ? "bg-green-400" : "bg-zinc-600"}`} />
            <div className="flex-1 min-w-0"><p className="text-sm text-zinc-200 truncate">{h.url}</p><p className="text-xs text-zinc-500">Event: {h.event}</p></div>
            <button onClick={() => remove(h.id)} className="text-red-400 hover:text-red-300"><Trash2 className="size-4" /></button>
          </div>
        ))}
        {hooks.length === 0 && <p className="text-center text-zinc-600 py-8">No webhooks configured</p>}
      </div>
    </div>
  );
}
