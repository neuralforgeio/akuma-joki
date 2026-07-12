"use client";
import { useEffect, useState } from "react";
import { Bug, Trash2 } from "lucide-react";

type LogEntry = { time: string; level: string; message: string };

const LOG_KEY = "akuma-dev-debug-logs";

export default function DevDebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Capture console errors/warnings
    const origError = console.error;
    const origWarn = console.warn;
    const capture = (level: string) => (...args: unknown[]) => {
      const msg = args.map(a => typeof a === "string" ? a : JSON.stringify(a)).join(" ");
      const entry: LogEntry = { time: new Date().toLocaleTimeString("id-ID"), level, message: msg };
      try {
        const existing = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
        const updated = [entry, ...existing].slice(0, 100);
        localStorage.setItem(LOG_KEY, JSON.stringify(updated));
        setLogs(updated);
      } catch { /* ignore */ }
      if (level === "error") origError(...args);
      else origWarn(...args);
    };
    console.error = capture("error");
    console.warn = capture("warn");

    // Load existing
    try { // eslint-disable-next-line react-hooks/set-state-in-effect
      setLogs(JSON.parse(localStorage.getItem(LOG_KEY) || "[]")); } catch { /* ignore */ }

    return () => { console.error = origError; console.warn = origWarn; };
  }, []);

  const filtered = filter === "all" ? logs : logs.filter(l => l.level === filter);
  const clear = () => { localStorage.removeItem(LOG_KEY); setLogs([]); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gradient">Debug Logs</h1><p className="mt-1 text-sm text-zinc-500">Capture console errors & warnings (developer only).</p></div>
        <button onClick={clear} className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"><Trash2 className="size-3.5" /> Clear</button>
      </div>
      <div className="flex gap-2">
        {["all", "error", "warn"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === f ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400" : "bg-white/5 border border-white/10 text-zinc-400"}`}>{f}</button>
        ))}
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><Bug className="size-4 text-cyan-400" /><span className="text-sm text-zinc-300">{filtered.length} logs</span></div>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filtered.map((l, i) => (
            <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-mono ${l.level === "error" ? "bg-red-500/5 text-red-400" : "bg-amber-500/5 text-amber-400"}`}>
              <span className="text-zinc-600 shrink-0">{l.time}</span>
              <span className="shrink-0 font-bold uppercase">[{l.level}]</span>
              <span className="break-all">{l.message}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-zinc-600 py-8">No logs captured</p>}
        </div>
      </div>
    </div>
  );
}
