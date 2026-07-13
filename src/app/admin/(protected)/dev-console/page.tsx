"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Play, Trash2, Search, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type CommandDef = {
  cmd: string;
  description: string;
  usage: string;
  example?: string;
  category: "store" | "vercel" | "github" | "system" | "cache";
  run: (args?: string) => Promise<string> | string;
};

export default function DevConsolePage() {
  const store = useAdminStore();
  const { toast } = useToast();
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<{ cmd: string; out: string; ts: number }[]>([
    { cmd: "", out: "Dev Console ready. Ketik '/' untuk lihat semua commands.", ts: Date.now() },
  ]);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const commands: CommandDef[] = useMemo(() => [
    // STORE
    {
      cmd: "stats",
      description: "Lihat statistik store (games, orders, visitors, reviews, reports)",
      usage: "stats",
      example: "stats",
      category: "store",
      run: () => `📊 AKUMA JOKI Stats:
  Games: ${store.games.length}
  Items: ${store.games.reduce((a, g) => a + g.categories.reduce((b, c) => b + c.items.length, 0), 0)}
  Orders: ${store.orders.length}
  Reviews: ${store.reviews.length}
  Reports: ${store.reports.length}
  Visitors: ${store.visitors.reduce((a, v) => a + v.count, 0)}
  Commits: ${store.commits.length}
  Activities: ${store.activityLog.length}`,
    },
    {
      cmd: "games",
      description: "List semua game dengan jumlah items",
      usage: "games",
      example: "games",
      category: "store",
      run: () => store.games.length === 0
        ? "No games."
        : store.games.map(g => `  ${g.emoji} ${g.name} (${g.slug}) - ${g.categories.reduce((a, c) => a + c.items.length, 0)} items`).join("\n"),
    },
    {
      cmd: "orders",
      description: "List semua orders dengan status",
      usage: "orders",
      example: "orders",
      category: "store",
      run: () => store.orders.length === 0
        ? "No orders."
        : store.orders.map(o => `  ${o.id} | ${o.productName} | ${o.status} | ${new Date(o.createdAt).toLocaleDateString("id-ID")}`).join("\n"),
    },
    {
      cmd: "reviews",
      description: "List review terbaru",
      usage: "reviews [limit]",
      example: "reviews 5",
      category: "store",
      run: (args) => {
        const limit = parseInt(args || "10");
        const r = store.reviews.slice(0, limit);
        return r.length === 0 ? "No reviews." : r.map(x => `  ${"★".repeat(x.rating)} ${x.customerName} → ${x.gameName} (${x.productName})`).join("\n");
      },
    },
    {
      cmd: "reports",
      description: "List contact reports",
      usage: "reports [limit]",
      example: "reports 5",
      category: "store",
      run: (args) => {
        const limit = parseInt(args || "10");
        const r = store.reports.slice(0, limit);
        return r.length === 0 ? "No reports." : r.map(x => `  [${x.status}] ${x.type}: ${x.subject} - by ${x.name}`).join("\n");
      },
    },

    // VERCEL
    {
      cmd: "vercel-status",
      description: "Cek status deployment Vercel terbaru",
      usage: "vercel-status",
      example: "vercel-status",
      category: "vercel",
      run: async () => {
        const res = await fetch("/api/vercel/status", { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) return `❌ Error: ${data.error}`;
        const latest = data.deployments?.[0];
        return `🚀 Vercel Status:
  User: @${data.username}
  Project: ${data.project?.name || "akuma-joki"}
  Latest: ${latest?.state || "unknown"} ${latest ? "(" + new Date(latest.created).toLocaleString("id-ID") + ")" : ""}
  Commit: ${latest?.commit || "n/a"}
  URL: ${latest ? "https://" + latest.url : "n/a"}`;
      },
    },
    {
      cmd: "deploy",
      description: "Trigger redeploy ke Vercel (latest commit)",
      usage: "deploy [git-ref]",
      example: "deploy\n        deploy main",
      category: "vercel",
      run: async (args) => {
        const action = args ? "deploy-git" : "redeploy";
        const res = await fetch("/api/vercel/deploy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ref: args }),
        });
        const data = await res.json();
        if (!data.ok) return `❌ Deploy failed: ${data.error}`;
        return `✅ ${data.message}\n  Deployment ID: ${data.deploymentId}\n  URL: https://${data.url}`;
      },
    },
    {
      cmd: "vercel-logs",
      description: "Lihat build logs deployment terbaru",
      usage: "vercel-logs [deploymentId]",
      example: "vercel-logs",
      category: "vercel",
      run: async (args) => {
        const url = args ? `/api/vercel/logs?deploymentId=${args}` : "/api/vercel/logs";
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) return `❌ Error: ${data.error}`;
        const logs = data.logs.slice(-20).map((l: any) => `  [${l.type}] ${l.text?.slice(0, 100) || ""}`).join("\n");
        return `📋 Logs for ${data.deploymentId.slice(0, 12)} (${data.count} total, showing last 20):\n${logs || "No logs."}`;
      },
    },
    {
      cmd: "env-list",
      description: "List Vercel env vars",
      usage: "env-list",
      example: "env-list",
      category: "vercel",
      run: async () => {
        const res = await fetch("/api/vercel/env", { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) return `❌ Error: ${data.error}`;
        return `🔐 Env Vars (${data.count}):
${data.envs.map((e: any) => `  ${e.key} [${e.type}] → ${e.target.join(", ")}`).join("\n")}`;
      },
    },

    // GITHUB
    {
      cmd: "sync-now",
      description: "Force sync data ke GitHub sekarang",
      usage: "sync-now",
      example: "sync-now",
      category: "github",
      run: () => {
        store.triggerSync("Manual sync from dev-console");
        return "✅ Sync triggered. Data akan di-push ke GitHub dalam 2 detik.";
      },
    },
    {
      cmd: "git-pull",
      description: "Fetch data terbaru dari GitHub (manual)",
      usage: "git-pull",
      example: "git-pull",
      category: "github",
      run: async () => {
        const res = await fetch("/api/synced-data", { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) return `❌ Error: ${data.error}`;
        store.syncFromServer(data.data);
        return `✅ Data fetched & synced.\n  Updated at: ${data.updatedAt}\n  Games: ${data.data.games?.length || 0}\n  Reviews: ${data.data.reviews?.length || 0}`;
      },
    },

    // CACHE
    {
      cmd: "refresh-data",
      description: "🔄 Trigger refresh data GLOBAL (semua device) — no GitHub push, no auto-deploy",
      usage: "refresh-data [reason]",
      example: "refresh-data after-update\n        refresh-data",
      category: "cache",
      run: async (args) => {
        const reason = args || "Manual refresh from dev-console";
        // Fetch latest data & sync immediately (no GitHub push)
        const res = await fetch("/api/synced-data", { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) return `❌ Error: ${data.error}`;
        useAdminStore.getState().syncFromServer(data.data);
        return `✅ Data refreshed on this device!\n  Updated at: ${data.updatedAt}\n  Reason: ${reason}\n\n  Note: Other devices akan auto-refresh dalam 60s via useAutoSync polling.\n  No GitHub push (prevents Vercel auto-deploy).`;
      },
    },
    {
      cmd: "clear-local",
      description: "Clear cache lokal device ini (preserve cookie consent & user prefs)",
      usage: "clear-local",
      example: "clear-local",
      category: "cache",
      run: () => {
        try {
          // Preserve important keys sebelum clear
          const preserveKeys = [
            "akuma-wishlist",
            "akuma-cart",
            "akuma-recently-viewed",
            "akuma-lang",
            "akuma-admin-session",
            "akuma-pwa-install-dismissed",
          ];
          const preserved: Record<string, string> = {};
          for (const k of preserveKeys) {
            const v = localStorage.getItem(k);
            if (v) preserved[k] = v;
          }
          // Cookie consent disimpan di cookie (bukan localStorage), jadi aman
          localStorage.clear();
          sessionStorage.clear();
          // Restore preserved keys
          for (const [k, v] of Object.entries(preserved)) {
            localStorage.setItem(k, v);
          }
        } catch {}
        return "✅ Local cache cleared (preserved: wishlist, cart, recently-viewed, lang, session).\n  Cookie consent aman (di cookie, bukan localStorage).\n  Reload page untuk apply visual changes.";
      },
    },
    {
      cmd: "reset-activity",
      description: "Hapus activity log (audit trail)",
      usage: "reset-activity",
      example: "reset-activity",
      category: "cache",
      run: () => {
        useAdminStore.setState({ activityLog: [] });
        return "✅ Activity log cleared.";
      },
    },

    // SYSTEM
    {
      cmd: "help",
      description: "Tampilkan semua commands & panduan",
      usage: "help [command]",
      example: "help\n        help deploy",
      category: "system",
      run: (args) => {
        if (args) {
          const c = commands.find(c => c.cmd === args);
          if (!c) return `❌ Command '${args}' tidak ditemukan.`;
          return `📖 ${c.cmd}\n  ${c.description}\n\n  Usage: ${c.usage}${c.example ? "\n  Example: " + c.example : ""}`;
        }
        const grouped = commands.reduce((acc, c) => {
          if (!acc[c.category]) acc[c.category] = [];
          acc[c.category].push(c);
          return acc;
        }, {} as Record<string, CommandDef[]>);
        let out = "📖 Dev Console Commands\n\n";
        for (const [cat, cmds] of Object.entries(grouped)) {
          out += `\n[${cat.toUpperCase()}]\n`;
          cmds.forEach(c => { out += `  ${c.cmd.padEnd(16)} ${c.description}\n`; });
        }
        out += "\n\nTip: Ketik '/<command>' untuk autocomplete. 'help <cmd>' untuk detail.";
        return out;
      },
    },
    {
      cmd: "version",
      description: "Cek versi app & stack",
      usage: "version",
      example: "version",
      category: "system",
      run: () => `AKUMA JOKI v2.1.0
  Next.js: 16.2.10
  Stack: Pure Frontend + Zustand + GitHub Sync
  Auto-sync: 60s polling
  Token: akuma_joki_token (Vercel)`,
    },
    {
      cmd: "whoami",
      description: "Cek user yang login saat ini",
      usage: "whoami",
      example: "whoami",
      category: "system",
      run: () => {
        try {
          const session = JSON.parse(localStorage.getItem("akuma-admin-session") || "{}");
          return `👤 Login as: ${session.user || "unknown"} (${session.role || "unknown"})\n  Login at: ${session.loginAt ? new Date(session.loginAt).toLocaleString("id-ID") : "unknown"}\n  Expires: ${session.expiresAt ? new Date(session.expiresAt).toLocaleString("id-ID") : "unknown"}`;
        } catch { return "❌ No session found"; }
      },
    },
    {
      cmd: "clear",
      description: "Clear console output",
      usage: "clear",
      example: "clear",
      category: "system",
      run: () => {
        setHistory([]);
        return "";
      },
    },
  ], [store]);

  // Filter palette
  const filteredCommands = useMemo(() => {
    const q = command.startsWith("/") ? command.slice(1).toLowerCase() : "";
    if (!q) return commands;
    return commands.filter(c => c.cmd.includes(q) || c.description.toLowerCase().includes(q));
  }, [command, commands]);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [history]);

  const runCommand = async (rawCmd?: string) => {
    const input = (rawCmd ?? command).trim();
    if (!input) return;
    setShowPalette(false);

    const [cmd, ...argsArr] = input.split(/\s+/);
    const args = argsArr.join(" ");
    const found = commands.find(c => c.cmd === cmd.toLowerCase());

    setExecuting(true);
    let out = "";
    try {
      if (found) {
        out = await found.run(args);
      } else {
        out = `❌ Unknown command: ${cmd}. Ketik 'help' untuk lihat semua commands.`;
      }
    } catch (e: any) {
      out = `❌ Error: ${e.message}`;
    } finally {
      setExecuting(false);
    }

    setHistory(prev => [...prev, { cmd: input, out, ts: Date.now() }]);
    setCommand("");
    setPaletteIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter
    if (e.key === "Enter") {
      if (showPalette && filteredCommands[paletteIndex]) {
        const selected = filteredCommands[paletteIndex];
        setCommand("");
        setShowPalette(false);
        runCommand(selected.cmd);
      } else {
        runCommand();
      }
      return;
    }
    // Arrow up/down untuk navigate palette
    if (showPalette && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPaletteIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPaletteIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Escape") {
        setShowPalette(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCommand(v);
    setShowPalette(v.startsWith("/"));
    setPaletteIndex(0);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gradient">Dev Console</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Eksekusi command langsung ke store, Vercel, GitHub. Developer only. Ketik <code className="px-1.5 py-0.5 rounded bg-white/5 text-violet-400 font-mono">/</code> untuk autocomplete.
        </p>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="size-4 text-cyan-400" />
          <span className="text-sm text-zinc-300">Console Output</span>
          <span className="text-[10px] text-zinc-600 ml-auto">{commands.length} commands available</span>
        </div>

        {/* Output */}
        <div ref={outputRef} className="bg-black/40 rounded-xl p-3 h-80 overflow-y-auto akuma-scroll font-mono text-xs space-y-2">
          {history.length === 0 ? (
            <div className="text-zinc-600 text-center py-4">Console cleared. Type a command.</div>
          ) : history.map((h, i) => (
            <div key={i}>
              {h.cmd && (
                <div className="text-cyan-400">
                  <span className="text-zinc-600">$</span> {h.cmd}
                </div>
              )}
              {h.out && <div className="text-green-400 whitespace-pre-wrap break-words">{h.out}</div>}
            </div>
          ))}
          {executing && <div className="text-yellow-400 animate-pulse">⏳ Executing...</div>}
        </div>

        {/* Input + Palette */}
        <div className="relative mt-3">
          {showPalette && filteredCommands.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 glass-nav-strong rounded-2xl border border-white/10 overflow-hidden max-h-64 overflow-y-auto akuma-scroll shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)]" style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}>
              <div className="px-3 py-2 border-b border-white/8 flex items-center gap-2 text-[10px] text-zinc-500">
                <Search className="size-3" />
                <span>{filteredCommands.length} commands · ↑↓ navigate · Enter select · Esc close</span>
              </div>
              {filteredCommands.map((c, i) => (
                <button
                  key={c.cmd}
                  onClick={() => {
                    setCommand("");
                    setShowPalette(false);
                    runCommand(c.cmd);
                  }}
                  onMouseEnter={() => setPaletteIndex(i)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors border-b border-white/5 last:border-0",
                    i === paletteIndex ? "bg-violet-500/10" : "hover:bg-white/5"
                  )}
                >
                  <ChevronRight className={cn("size-3.5 mt-0.5 shrink-0", i === paletteIndex ? "text-violet-400" : "text-zinc-600")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-100">{c.cmd}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500 uppercase tracking-wider">{c.category}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{c.description}</p>
                    {i === paletteIndex && (
                      <p className="text-[10px] text-violet-400 mt-1 font-mono">
                        Usage: {c.usage}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-mono text-sm">$</span>
              <input
                ref={inputRef}
                value={command}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => command.startsWith("/") && setShowPalette(true)}
                placeholder="Ketik command atau '/' untuk lihat semua..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-zinc-100 font-mono outline-none focus:border-cyan-500/40"
                disabled={executing}
              />
            </div>
            <button
              onClick={() => runCommand()}
              disabled={executing || !command.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
            >
              <Play className="size-4" /> Run
            </button>
          </div>
        </div>

        {/* Quick commands */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["help", "stats", "vercel-status", "deploy", "refresh-data", "sync-now"].map(q => (
            <button
              key={q}
              onClick={() => runCommand(q)}
              disabled={executing}
              className="rounded-lg bg-white/3 border border-white/8 px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Tip */}
        <div className="mt-3 flex items-start gap-2 text-[10px] text-zinc-600">
          <Clock className="size-3 mt-0.5 shrink-0" />
          <span>
            Tip: <code className="text-zinc-400">refresh-data</code> = global data refresh (no reload, no clear), <code className="text-zinc-400">clear-local</code> = clear cache device ini (preserve user prefs).
            Pakai <code className="text-zinc-400">/</code> untuk autocomplete.
          </span>
        </div>
      </div>
    </div>
  );
}
