"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isDeveloper } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { HelpBanner } from "@/components/admin/help-tooltip";
import {
  Rocket, RefreshCw, FileText, Settings, Trash2, Plus,
  CheckCircle2, XCircle, Clock, ExternalLink, GitBranch, AlertCircle, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Deployment = {
  uid: string;
  url: string;
  state: string;
  created: number;
  ready: number | null;
  source: string;
  commit: string | null;
  branch: string | null;
  author: string | null;
  target: string | null;
};

type EnvVar = {
  id: string;
  key: string;
  type: string;
  target: string[];
  createdAt: string;
  updatedBy?: string;
};

type Status = {
  ok: boolean;
  username?: string;
  project?: any;
  deployments?: Deployment[];
  error?: string;
};

const STATE_META: Record<string, { color: string; bg: string; label: string; icon: typeof CheckCircle2 }> = {
  READY: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Ready", icon: CheckCircle2 },
  BUILDING: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", label: "Building", icon: Clock },
  ERROR: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Error", icon: XCircle },
  QUEUED: { color: "#22d3ee", bg: "rgba(34,211,238,0.1)", label: "Queued", icon: Clock },
  CANCELED: { color: "#71717a", bg: "rgba(113,113,122,0.1)", label: "Canceled", icon: XCircle },
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function DevVercelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState<{ deploymentId: string; logs: any[] } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [envs, setEnvs] = useState<EnvVar[]>([]);
  const [envLoading, setEnvLoading] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [addingEnv, setAddingEnv] = useState(false);

  useEffect(() => {
    if (!isDeveloper()) {
      toast({ title: "Akses ditolak: developer only", variant: "destructive" });
      router.replace("/admin");
      return;
    }
    setAuthorized(true);
    fetchStatus();
    fetchEnvs();
  }, [router, toast]);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vercel/status", { cache: "no-store" });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ ok: false, error: "Failed to fetch status" });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEnvs = useCallback(async () => {
    setEnvLoading(true);
    try {
      const res = await fetch("/api/vercel/env", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setEnvs(data.envs);
    } catch { /* ignore */ }
    finally { setEnvLoading(false); }
  }, []);

  const fetchLogs = useCallback(async (deploymentId?: string) => {
    setLogsLoading(true);
    try {
      const url = deploymentId ? `/api/vercel/logs?deploymentId=${deploymentId}` : "/api/vercel/logs";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setLogs({ deploymentId: data.deploymentId, logs: data.logs });
      } else {
        toast({ title: data.error || "Failed to fetch logs", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to fetch logs", variant: "destructive" });
    } finally {
      setLogsLoading(false);
    }
  }, [toast]);

  const handleDeploy = async (action: "redeploy" | "deploy-git", ref?: string) => {
    setDeploying(true);
    try {
      const res = await fetch("/api/vercel/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ref }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `✅ ${data.message}`, description: data.url ? `URL: ${data.url}` : undefined });
        setTimeout(() => fetchStatus(), 2000);
      } else {
        toast({ title: data.error || "Deploy failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Deploy request failed", variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  };

  const handleAddEnv = async () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) {
      toast({ title: "Key & value wajib diisi", variant: "destructive" });
      return;
    }
    setAddingEnv(true);
    try {
      const res = await fetch("/api/vercel/env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newEnvKey.trim(), value: newEnvValue.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `✅ ${data.message}` });
        setNewEnvKey("");
        setNewEnvValue("");
        fetchEnvs();
      } else {
        toast({ title: data.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to add env", variant: "destructive" });
    } finally {
      setAddingEnv(false);
    }
  };

  const handleDeleteEnv = async (id: string, key: string) => {
    if (!confirm(`Hapus env var '${key}'?`)) return;
    try {
      const res = await fetch(`/api/vercel/env?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `✅ ${data.message}` });
        fetchEnvs();
      } else {
        toast({ title: data.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-pixel text-xs uppercase text-violet-400 animate-pulse">Memeriksa akses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <HelpBanner
        title="Vercel Control"
        description="Kelola deployment, logs, dan env vars Vercel project AKUMA JOKI langsung dari dashboard. Pakai Vercel API."
        tips={[
          "Token: akuma_joki_token (di-set di Vercel project env vars)",
          "Status: lihat deployment terbaru & build state",
          "Deploy: trigger redeploy atau deploy dari git ref",
          "Logs: lihat build logs (stdout/stderr)",
          "Env: tambah/hapus env vars (production/preview/dev)",
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gradient">Vercel Control</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {status?.ok && status.username ? `Connected as @${status.username}` : "Not connected"}
            {status?.project?.name ? ` · Project: ${status.project.name}` : ""}
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          onClick={() => handleDeploy("redeploy")}
          disabled={deploying || loading}
          className="glass rounded-2xl p-4 text-left hover:border-violet-500/30 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30">
              <Rocket className="size-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100">Redeploy Latest</p>
              <p className="text-[10px] text-zinc-500">Trigger deploy dari latest commit</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleDeploy("deploy-git", "main")}
          disabled={deploying || loading}
          className="glass rounded-2xl p-4 text-left hover:border-cyan-500/30 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30">
              <GitBranch className="size-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100">Deploy from main</p>
              <p className="text-[10px] text-zinc-500">Deploy dari branch main</p>
            </div>
          </div>
        </button>

        <a
          href={`https://vercel.com/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          className="glass rounded-2xl p-4 hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <ExternalLink className="size-5 text-zinc-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100">Vercel Dashboard</p>
              <p className="text-[10px] text-zinc-500">Buka dashboard Vercel</p>
            </div>
          </div>
        </a>
      </div>

      {/* Deployments */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="size-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Recent Deployments</h2>
        </div>
        {!status || loading ? (
          <p className="text-sm text-zinc-500 py-6 text-center">Loading deployments...</p>
        ) : !status.ok ? (
          <div className="glass rounded-xl p-4 border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400">Failed to load status</p>
                <p className="text-[10px] text-zinc-500 mt-1">{status.error}</p>
              </div>
            </div>
          </div>
        ) : !status.deployments || status.deployments.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">No deployments found</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto akuma-scroll">
            {status.deployments.map((d) => {
              const meta = STATE_META[d.state] || STATE_META.READY;
              const StateIcon = meta.icon;
              return (
                <div key={d.uid} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: meta.bg, color: meta.color }}
                  >
                    <StateIcon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-100 truncate">
                      {d.commit || `${d.source} · ${formatTime(d.created)}`}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {d.branch && <span>{d.branch} · </span>}
                      {d.author && <span>@{d.author} · </span>}
                      {formatRelative(d.created)}
                      {d.target === "production" && <span className="text-violet-400"> · PROD</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`https://${d.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-zinc-500 hover:text-violet-400 hover:bg-white/5 transition-all"
                      aria-label="Open deployment"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                    <button
                      onClick={() => fetchLogs(d.uid)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-white/5 transition-all"
                      aria-label="View logs"
                    >
                      <FileText className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logs */}
      {logs && (
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Build Logs</h2>
              <span className="text-[10px] text-zinc-500 font-mono">{logs.deploymentId.slice(0, 12)}</span>
            </div>
            <button onClick={() => setLogs(null)} className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">×</button>
          </div>
          {logsLoading ? (
            <p className="text-sm text-zinc-500 py-6 text-center">Loading logs...</p>
          ) : (
            <div className="bg-black/40 rounded-xl p-3 h-64 overflow-y-auto akuma-scroll font-mono text-[11px] space-y-0.5">
              {logs.logs.length === 0 ? (
                <p className="text-zinc-600 text-center py-4">No logs available</p>
              ) : (
                logs.logs.map((log, i) => (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap break-all",
                      log.type === "stderr" ? "text-red-400" : log.type === "exit" ? "text-yellow-400" : "text-green-400"
                    )}
                  >
                    {log.text}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Env Vars */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Environment Variables</h2>
            <span className="text-[10px] text-zinc-500">({envs.length})</span>
          </div>
          <button
            onClick={fetchEnvs}
            disabled={envLoading}
            className="text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            {envLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Add new env */}
        <div className="glass rounded-xl p-3 mb-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newEnvKey}
              onChange={(e) => setNewEnvKey(e.target.value)}
              placeholder="KEY (mis. DATABASE_URL)"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono outline-none focus:border-violet-500/40"
            />
            <input
              type="password"
              value={newEnvValue}
              onChange={(e) => setNewEnvValue(e.target.value)}
              placeholder="value"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/40"
            />
            <button
              onClick={handleAddEnv}
              disabled={addingEnv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 px-3 py-2 text-sm text-violet-400 hover:bg-violet-500/30 transition-all disabled:opacity-50"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
          <p className="text-[10px] text-zinc-600">
            Value di-encrypt oleh Vercel. Tidak bisa dilihat setelah disimpan (security).
          </p>
        </div>

        {/* Env list */}
        {envs.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            {envLoading ? "Loading..." : "No env vars found"}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto akuma-scroll">
            {envs.map((e) => (
              <div key={e.id} className="glass rounded-lg px-3 py-2 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-100 font-mono truncate">{e.key}</p>
                  <p className="text-[10px] text-zinc-600">
                    {e.type} · {e.target.join(", ")} · {formatTime(new Date(e.createdAt).getTime())}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteEnv(e.id, e.key)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all shrink-0"
                  aria-label="Hapus"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
