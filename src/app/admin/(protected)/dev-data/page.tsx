"use client";
import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { Database, Copy } from "lucide-react";

export default function DevDataPage() {
  const state = useAdminStore();
  const [tab, setTab] = useState<"games"|"orders"|"settings"|"activity"|"visitors"|"raw">("games");

  const data = {
    games: state.games,
    orders: state.orders,
    settings: state.settings,
    activity: state.activityLog,
    visitors: state.visitors,
    raw: {
      announcement: state.announcement,
      takedown: state.takedown,
      takedownReason: state.takedownReason,
      faq: state.faq,
      waReplies: state.waReplies,
      commits: state.commits,
      artifacts: state.artifacts,
    },
  };

  const copyJson = () => { navigator.clipboard.writeText(JSON.stringify(data[tab], null, 2)); };

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-gradient">Data Inspector</h1><p className="mt-1 text-sm text-zinc-500">Inspect semua data di admin store (localStorage).</p></div>
      <div className="flex flex-wrap gap-2">
        {Object.keys(data).map(k => (
          <button key={k} onClick={() => setTab(k as typeof tab)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tab === k ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400" : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10"}`}>{k}</button>
        ))}
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Database className="size-4 text-cyan-400" /><span className="text-sm text-zinc-300">{tab} ({Array.isArray(data[tab]) ? data[tab].length : Object.keys(data[tab]).length} entries)</span></div>
          <button onClick={copyJson} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-cyan-400"><Copy className="size-3" /> Copy JSON</button>
        </div>
        <pre className="bg-black/40 rounded-xl p-3 text-xs text-green-400 overflow-x-auto max-h-96 font-mono">{JSON.stringify(data[tab], null, 2)}</pre>
      </div>
    </div>
  );
}
