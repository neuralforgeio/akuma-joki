"use client";
import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { Terminal, Play, Trash2 } from "lucide-react";

export default function DevConsolePage() {
  const store = useAdminStore();
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<string[]>(["> Dev Console ready. Type 'help' for commands."]);

  const commands: Record<string, () => string> = {
    help: () => "Available: help, stats, games, orders, visitors, clear-cache, version, reset-activity",
    stats: () => `Games: ${store.games.length} | Orders: ${store.orders.length} | Visitors: ${store.visitors.reduce((a,v)=>a+v.count,0)} | Commits: ${store.commits.length}`,
    games: () => store.games.map(g => `${g.emoji} ${g.name} (${g.slug}) - ${g.categories.reduce((a,c)=>a+c.items.length,0)} items`).join("\n"),
    orders: () => store.orders.length === 0 ? "No orders" : store.orders.map(o => `${o.id} | ${o.productName} | ${o.status}`).join("\n"),
    visitors: () => store.visitors.map(v => `${v.date}: ${v.count}`).join("\n"),
    "clear-cache": () => { try { localStorage.clear(); sessionStorage.clear(); } catch {} return "Cache cleared. Reload to apply."; },
    version: () => "AKUMA JOKI v2.0.5 | Next.js 16.2.10 | Pure Frontend",
    "reset-activity": () => { useAdminStore.setState({ activityLog: [] }); return "Activity log cleared."; },
  };

  const runCommand = () => {
    const cmd = command.trim().toLowerCase();
    if (!cmd) return;
    const fn = commands[cmd];
    const result = fn ? fn() : `Unknown command: ${cmd}. Type 'help'.`;
    setOutput(prev => [...prev, `> ${cmd}`, result]);
    setCommand("");
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-gradient">Dev Console</h1><p className="mt-1 text-sm text-zinc-500">Eksekusi command langsung ke store. Developer only.</p></div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><Terminal className="size-4 text-cyan-400" /><span className="text-sm text-zinc-300">Console Output</span></div>
        <div className="bg-black/40 rounded-xl p-3 h-64 overflow-y-auto font-mono text-xs text-green-400 space-y-1">
          {output.map((line, i) => <div key={i} className={line.startsWith(">") ? "text-cyan-400" : ""}>{line}</div>)}
        </div>
        <div className="flex gap-2 mt-3">
          <input value={command} onChange={e => setCommand(e.target.value)} onKeyDown={e => e.key === "Enter" && runCommand()} placeholder="Type command..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500/40" />
          <button onClick={runCommand} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/30 transition-all"><Play className="size-4" /> Run</button>
        </div>
      </div>
    </div>
  );
}
