"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { PixelButton } from "@/components/akuma/pixel-button";
import { useToast } from "@/hooks/use-toast";
import { GitCommit, Save, RotateCcw, History, Rocket, RefreshCw } from "lucide-react";

export default function CommitPage() {
  const commits = useAdminStore((s) => s.commits);
  const createCommit = useAdminStore((s) => s.createCommit);
  const rollbackCommit = useAdminStore((s) => s.rollbackCommit);
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [deploying, setDeploying] = useState(false);

  const handleCommit = () => {
    if (!message.trim()) {
      toast({ title: "Tulis pesan commit", variant: "destructive" });
      return;
    }
    createCommit(message.trim(), "admin");
    setMessage("");
    toast({ title: "Commit dibuat!" });
  };

  const handleRollback = (id: string, msg: string) => {
    if (confirm(`Rollback ke commit "${msg}"? Data saat ini akan diganti dengan snapshot.`)) {
      rollbackCommit(id);
      toast({ title: "Rollback berhasil!" });
    }
  };

  const handleTriggerDeploy = async () => {
    if (!confirm("Trigger deploy ke Vercel? Ini akan redeploy latest commit.")) return;
    setDeploying(true);
    try {
      const res = await fetch("/api/vercel/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeploy" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `✅ ${data.message}`, description: data.url ? `URL: ${data.url}` : undefined });
      } else {
        toast({ title: data.error || "Deploy failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Deploy request failed", variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
          COMMIT HISTORY
        </h1>
        <p className="mt-1 text-sm text-[#9a93a8]">
          Snapshot perubahan data untuk backup & rollback. Hubungkan ke Vercel untuk deploy.
        </p>
      </div>

      {/* Quick action: Trigger Vercel deploy */}
      <div className="border-2 border-cyan-500/30 bg-[#121017] pixel-corner p-5 max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-pixel text-[9px] uppercase text-[#22d3ee] flex items-center gap-2">
            <Rocket className="size-3" /> Vercel Deploy
          </h2>
        </div>
        <p className="text-xs text-[#9a93a8] mb-3">
          Trigger deploy ke Vercel langsung dari sini. Pakai token <code className="text-cyan-400">akuma_joki_token</code>.
        </p>
        <button
          onClick={handleTriggerDeploy}
          disabled={deploying}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
        >
          {deploying ? <RefreshCw className="size-4 animate-spin" /> : <Rocket className="size-4" />}
          {deploying ? "Deploying..." : "Trigger Deploy"}
        </button>
      </div>

      {/* create commit */}
      <div className="border-2 border-[#a020f0]/50 bg-[#121017] pixel-corner p-5 max-w-2xl">
        <h2 className="mb-3 font-pixel text-[9px] uppercase text-[#c44bff]">Buat Commit Baru</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mis. Update harga Blox Fruits"
            className="flex-1 bg-[#0a0a0a] border-2 border-[#2a2436] focus:border-[#a020f0] text-[#e5e5e5] px-4 py-2 text-sm pixel-corner outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommit();
            }}
          />
          <PixelButton size="sm" onClick={handleCommit}>
            <Save className="size-3" /> Commit
          </PixelButton>
        </div>
        <p className="mt-2 font-pixel text-[6px] uppercase text-[#5a5266]">
          Simpan snapshot games, announcement, takedown saat ini.
        </p>
      </div>

      {/* commit list */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="size-4 text-[#ffd166]" />
          <h2 className="font-pixel text-[9px] uppercase text-[#e5e5e5]">
            History ({commits.length})
          </h2>
        </div>
        {commits.length === 0 ? (
          <p className="font-pixel text-[7px] uppercase text-[#5a5266] text-center py-8">
            Belum ada commit. Buat commit pertama untuk menyimpan snapshot data.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto akuma-scroll">
            {commits.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 border-l-2 border-[#ffd166]/40 pl-4 py-2"
              >
                <GitCommit className="size-4 text-[#ffd166] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e5e5e5]">{c.message}</p>
                  <p className="font-pixel text-[6px] text-[#5a5266] mt-0.5">
                    {c.author} · {new Date(c.timestamp).toLocaleString("id-ID")}
                  </p>
                  <p className="font-pixel text-[6px] text-[#9a93a8] mt-0.5">
                    Snapshot: {c.snapshot.games.length} games ·{" "}
                    {c.snapshot.announcement ? "announcement on" : "no announcement"} ·{" "}
                    takedown {c.snapshot.takedown ? "on" : "off"}
                  </p>
                </div>
                <button
                  onClick={() => handleRollback(c.id, c.message)}
                  className="flex items-center gap-1 font-pixel text-[7px] uppercase text-[#7fd4ff] border-2 border-[#7fd4ff]/40 px-2 py-1 pixel-corner hover:bg-[#7fd4ff]/10 shrink-0"
                >
                  <RotateCcw className="size-3" /> Rollback
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
