"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isDeveloper } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { HelpBanner } from "@/components/admin/help-tooltip";
import {
  Rocket, RefreshCw, FileText, Settings, Trash2, Plus,
  CheckCircle2, XCircle, Clock, ExternalLink, GitBranch, AlertCircle, Activity,
  ChevronRight, ArrowLeft, Code, Globe, Cpu, MemoryStick, Timer, User, RotateCcw, Copy, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { confirmAction } from "@/lib/confirm-modal";

type Deployment = {
  uid: string;
  url: string;
  state: string;
  created: number;
  ready: number | null;
  building: number | null;
  source: string;
  commit: string | null;
  commitSha: string | null;
  commitRef: string | null;
  author: string | null;
  authorAvatar: string | null;
  target: string | null;
  alias: string[];
  inspectorUrl: string | null;
  memoryUsage: number | null;
  duration: number | null;
};

type EnvVar = {
  id: string;
  key: string;
  type: string;
  target: string[];
  createdAt: string;
  updatedBy?: string;
};

type LogEntry = { type: string; text: string; ts: number };

const STATE_META: Record<string, { color: string; bg: string; label: string; icon: typeof CheckCircle2 }> = {
  READY: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Ready", icon: CheckCircle2 },
  BUILDING: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", label: "Building", icon: Clock },
  ERROR: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Error", icon: XCircle },
  QUEUED: { color: "#22d3ee", bg: "rgba(34,211,238,0.1)", label: "Queued", icon: Clock },
  CANCELED: { color: "#71717a", bg: "rgba(113,113,122,0.1)", label: "Canceled", icon: XCircle },
  INITIALIZING: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "Initializing", icon: Clock },
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

function formatDuration(ms: number | null) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

const PROJECT_URL = "https://akuma-joki.vercel.app/";

export default function DevVercelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [selectedDep, setSelectedDep] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [envs, setEnvs] = useState<EnvVar[]>([]);
  const [envLoading, setEnvLoading] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [addingEnv, setAddingEnv] = useState(false);
  const [activeView, setActiveView] = useState<"deployments" | "env" | "project">("deployments");
  const [logFilter, setLogFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!isDeveloper()) {
      toast({ title: "Akses ditolak: developer only", variant: "destructive" });
      router.replace("/admin");
      return;
    }
    setAuthorized(true);
    fetchDeployments();
    fetchEnvs();
  }, [router, toast]);

  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vercel/deployments?limit=30", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setDeployments(data.deployments);
      else toast({ title: data.error || "Failed to fetch deployments", variant: "destructive" });
    } catch {
      toast({ title: "Failed to fetch deployments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchEnvs = useCallback(async () => {
    setEnvLoading(true);
    try {
      const res = await fetch("/api/vercel/env", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setEnvs(data.envs);
    } catch { /* ignore */ }
    finally { setEnvLoading(false); }
  }, []);

  const fetchLogs = useCallback(async (deploymentId: string) => {
    setLogsLoading(true);
    setLogs([]);
    try {
      const res = await fetch(`/api/vercel/logs?deploymentId=${deploymentId}&limit=100`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setLogs(data.logs);
      else toast({ title: data.error || "Failed to fetch logs", variant: "destructive" });
    } catch {
      toast({ title: "Failed to fetch logs", variant: "destructive" });
    } finally {
      setLogsLoading(false);
    }
  }, [toast]);

  // Auto-refresh logs setiap 5 detik jika autoRefresh aktif & deployment terpilih
  useEffect(() => {
    if (!autoRefresh || !selectedDep) return;
    const interval = setInterval(() => {
      fetchLogs(selectedDep.uid);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedDep, fetchLogs]);

  // Auto-refresh deployments list setiap 15 detik
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDeployments();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchDeployments]);

  const handleDeploy = async (action: "redeploy" | "deploy-git" | "rollback" | "promote", refOrId?: string) => {
    setDeploying(true);
    try {
      const body: any = { action };
      if ((action === "rollback" || action === "promote" || action === "redeploy") && refOrId) {
        body.deploymentId = refOrId;
      } else if (action === "deploy-git" && refOrId) {
        body.ref = refOrId;
      }

      const res = await fetch("/api/vercel/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `✅ ${data.message}`, description: data.url ? `URL: ${data.url}` : undefined });
        setTimeout(() => fetchDeployments(), 3000);
      } else {
        toast({ title: data.error || "Deploy failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Deploy request failed", variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  };

  const handleCancelDeploy = async (deploymentId: string) => {
    setDeploying(true);
    try {
      const res = await fetch("/api/vercel/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deploymentId }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `✅ ${data.message}` });
        setTimeout(() => fetchDeployments(), 2000);
      } else {
        toast({ title: data.error || "Cancel failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Cancel request failed", variant: "destructive" });
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
    confirmAction({
      title: "Hapus Env Var?",
      message: `Env var '${key}' akan dihapus permanen dari project.`,
      variant: "danger",
      confirmLabel: "Hapus",
      onConfirm: async () => {
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
      },
    });
  };

  const handleSelectDeployment = (dep: Deployment) => {
    setSelectedDep(dep);
    fetchLogs(dep.uid);
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-pixel text-xs uppercase text-violet-400 animate-pulse">Memeriksa akses...</p>
      </div>
    );
  }

  // Stats
  const stats = {
    total: deployments.length,
    ready: deployments.filter(d => d.state === "READY").length,
    building: deployments.filter(d => d.state === "BUILDING" || d.state === "INITIALIZING" || d.state === "QUEUED").length,
    errors: deployments.filter(d => d.state === "ERROR").length,
  };

  return (
    <div className="space-y-5">
      <HelpBanner
        title="Vercel Control"
        description="Kelola deployment AKUMA JOKI (akuma-joki.vercel.app). Full control untuk developer."
        tips={[
          "Deployments: klik deployment mana pun untuk lihat detail & logs",
          "Trigger deploy: redeploy latest atau deploy dari git ref",
          "Env vars: tambah/hapus env vars (production/preview/dev)",
          "Project info: URL, framework, target deployments",
          "Token: akuma_joki_token (di Vercel project env vars)",
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gradient">Vercel Control</h1>
          <p className="mt-1 text-sm text-zinc-500 flex items-center gap-2 flex-wrap">
            <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
              <Globe className="size-3.5" /> akuma-joki.vercel.app
            </a>
            <span className="text-zinc-700">·</span>
            <span>{stats.total} deployments</span>
            <span className="text-zinc-700">·</span>
            <span className="text-green-400">{stats.ready} ready</span>
            {stats.building > 0 && <><span className="text-zinc-700">·</span><span className="text-yellow-400">{stats.building} building</span></>}
            {stats.errors > 0 && <><span className="text-zinc-700">·</span><span className="text-red-400">{stats.errors} errors</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={PROJECT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-400 hover:bg-green-500/20 transition-all"
          >
            <ExternalLink className="size-4" /> Live
          </a>
          <button
            onClick={fetchDeployments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleDeploy("redeploy")}
          disabled={deploying}
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
          disabled={deploying}
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
          href="https://vercel.com/dashboard"
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

      {/* View tabs */}
      <div className="flex gap-1.5 border-b border-white/8 pb-1">
        {[
          { id: "deployments" as const, label: "Deployments", icon: Activity },
          { id: "env" as const, label: "Env Vars", icon: Settings },
          { id: "project" as const, label: "Project Info", icon: Globe },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveView(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-all",
                activeView === t.id ? "bg-violet-500/10 text-violet-400 border-b-2 border-violet-500" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* DEPLOYMENTS VIEW */}
      {activeView === "deployments" && (
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Deployments list (left) */}
          <div className={cn("glass rounded-2xl p-4", selectedDep ? "lg:col-span-2" : "lg:col-span-5")}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-zinc-100">All Deployments</h2>
                <span className="text-[10px] text-zinc-500">({deployments.length})</span>
              </div>
            </div>
            {loading ? (
              <p className="text-sm text-zinc-500 py-8 text-center">Loading...</p>
            ) : deployments.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">No deployments found</p>
            ) : (
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto akuma-scroll">
                {deployments.map(d => {
                  const meta = STATE_META[d.state] || STATE_META.READY;
                  const StateIcon = meta.icon;
                  const isSelected = selectedDep?.uid === d.uid;
                  return (
                    <button
                      key={d.uid}
                      onClick={() => handleSelectDeployment(d)}
                      className={cn(
                        "w-full text-left rounded-xl p-3 transition-all border",
                        isSelected ? "bg-violet-500/10 border-violet-500/40" : "bg-white/3 border-transparent hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
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
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 flex-wrap">
                            {d.commitRef && <span className="inline-flex items-center gap-0.5"><GitBranch className="size-2.5" />{d.commitRef}</span>}
                            <span>·</span>
                            <span>{formatRelative(d.created)}</span>
                            {d.target === "production" && <span className="text-violet-400 font-semibold">· PROD</span>}
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-zinc-600 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail view (right) */}
          {selectedDep && (
            <div className="lg:col-span-3 space-y-4">
              {/* Back button (mobile) */}
              <button
                onClick={() => { setSelectedDep(null); setLogs([]); }}
                className="lg:hidden inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                <ArrowLeft className="size-3.5" /> Back to list
              </button>

              {/* Deployment info */}
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const meta = STATE_META[selectedDep.state] || STATE_META.READY;
                      const StateIcon = meta.icon;
                      return (
                        <>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: meta.bg, color: meta.color }}>
                            <StateIcon className="size-4" />
                          </div>
                          <span className="text-sm font-semibold text-zinc-100">{meta.label}</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://${selectedDep.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 border border-green-500/30 px-2.5 py-1.5 text-[11px] text-green-400 hover:bg-green-500/20 transition-all"
                    >
                      <ExternalLink className="size-3" /> Visit
                    </a>
                    {selectedDep.inspectorUrl && (
                      <a
                        href={selectedDep.inspectorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1.5 text-[11px] text-cyan-400 hover:bg-cyan-500/20 transition-all"
                      >
                        <Code className="size-3" /> Inspector
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedDep.commit && (
                    <InfoRow icon={GitBranch} label="Commit" value={selectedDep.commit} />
                  )}
                  {selectedDep.commitSha && (
                    <InfoRow icon={Code} label="SHA" value={selectedDep.commitSha.slice(0, 12)} mono />
                  )}
                  {selectedDep.author && (
                    <InfoRow icon={User} label="Author" value={selectedDep.author} avatar={selectedDep.authorAvatar} />
                  )}
                  <InfoRow icon={Clock} label="Created" value={formatTime(selectedDep.created)} />
                  {selectedDep.ready && (
                    <InfoRow icon={CheckCircle2} label="Ready" value={formatTime(selectedDep.ready)} />
                  )}
                  {selectedDep.duration && (
                    <InfoRow icon={Timer} label="Duration" value={formatDuration(selectedDep.duration)} />
                  )}
                  {selectedDep.memoryUsage && (
                    <InfoRow icon={MemoryStick} label="Memory" value={`${(selectedDep.memoryUsage / 1024 / 1024).toFixed(1)} MB`} />
                  )}
                  {selectedDep.target && (
                    <InfoRow icon={Rocket} label="Target" value={selectedDep.target} badge />
                  )}
                  {selectedDep.alias.length > 0 && (
                    <InfoRow icon={Globe} label="Alias" value={selectedDep.alias.join(", ")} />
                  )}
                </div>

                {/* Action buttons: Redeploy, Rollback, Promote, Cancel */}
                <div className="mt-4 pt-4 border-t border-white/8 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDeploy("redeploy", selectedDep.uid)}
                    disabled={deploying}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 px-3 py-2 text-xs text-violet-400 hover:bg-violet-500/25 transition-all disabled:opacity-50"
                  >
                    <Rocket className="size-3.5" /> Redeploy
                  </button>
                  <button
                    onClick={() => {
                      confirmAction({
                        title: "Instant Rollback?",
                        message: `Rollback ke deployment ini?\n\nCommit: ${selectedDep.commit || selectedDep.uid.slice(0, 12)}\n\nIni akan membuat deployment PRODUCTION baru dengan code yang sama.`,
                        variant: "warning",
                        confirmLabel: "Rollback",
                        onConfirm: () => handleDeploy("rollback", selectedDep.uid),
                      });
                    }}
                    disabled={deploying}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-400 hover:bg-yellow-500/25 transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="size-3.5" /> Instant Rollback
                  </button>
                  <button
                    onClick={() => {
                      confirmAction({
                        title: "Promote to Production?",
                        message: `Promote deployment ini ke production?\n\nCommit: ${selectedDep.commit || selectedDep.uid.slice(0, 12)}\n\nProduction URL akan update ke versi ini.`,
                        variant: "info",
                        confirmLabel: "Promote",
                        onConfirm: () => handleDeploy("promote", selectedDep.uid),
                      });
                    }}
                    disabled={deploying}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/15 border border-green-500/30 px-3 py-2 text-xs text-green-400 hover:bg-green-500/25 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-3.5" /> Promote to Prod
                  </button>
                  {(selectedDep.state === "BUILDING" || selectedDep.state === "QUEUED" || selectedDep.state === "INITIALIZING") && (
                    <button
                      onClick={() => {
                        confirmAction({
                          title: "Cancel Deploy?",
                          message: `Cancel deployment ini?\n\n${selectedDep.commit || selectedDep.uid.slice(0, 12)}\n\nBuild akan dihentikan.`,
                          variant: "danger",
                          confirmLabel: "Cancel Deploy",
                          onConfirm: () => handleCancelDeploy(selectedDep.uid),
                        });
                      }}
                      disabled={deploying}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-50"
                    >
                      <XCircle className="size-3.5" /> Cancel Deploy
                    </button>
                  )}
                </div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-cyan-400" />
                    <h2 className="text-sm font-semibold text-zinc-100">Build Logs</h2>
                    <span className="text-[10px] text-zinc-500 font-mono">({logs.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const text = logs.map(l => `[${l.type}] ${l.text || ""}`).join("\n");
                        try { navigator.clipboard.writeText(text); toast({ title: "✅ All logs copied!" }); } catch {}
                      }}
                      disabled={logs.length === 0}
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-cyan-400 disabled:opacity-50"
                    >
                      <Copy className="size-3" /> Copy All
                    </button>
                    <button
                      onClick={() => {
                        const text = logs.map(l => `[${new Date(l.ts || 0).toISOString()}] [${l.type}] ${l.text || ""}`).join("\n");
                        const blob = new Blob([text], { type: "text/plain" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = `akuma-logs-${selectedDep.uid.slice(0, 12)}-${Date.now()}.log`;
                        a.click();
                        URL.revokeObjectURL(a.href);
                        toast({ title: "✅ Logs downloaded!" });
                      }}
                      disabled={logs.length === 0}
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-green-400 disabled:opacity-50"
                    >
                      <Download className="size-3" /> Download .log
                    </button>
                    <label className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-violet-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="size-3 rounded"
                      />
                      Auto-refresh
                    </label>
                    <button
                      onClick={() => fetchLogs(selectedDep.uid)}
                      disabled={logsLoading}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300"
                    >
                      {logsLoading ? "Loading..." : "Refresh"}
                    </button>
                  </div>
                </div>

                {/* Log type filter & search */}
                {logs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {["all", "stdout", "stderr", "command", "exit"].map(t => {
                      const count = t === "all" ? logs.length : logs.filter(l => l.type === t).length;
                      return (
                        <button
                          key={t}
                          onClick={() => setLogFilter(t)}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider transition-all border",
                            logFilter === t ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          {t} ({count})
                        </button>
                      );
                    })}
                    <input
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      placeholder="Search logs..."
                      className="ml-auto w-40 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-zinc-100 outline-none focus:border-cyan-500/40"
                    />
                  </div>
                )}

                {logsLoading ? (
                  <p className="text-sm text-zinc-500 py-8 text-center">Loading logs...</p>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-8 text-center">No logs available</p>
                ) : (
                  <div className="bg-black/50 rounded-xl p-3 h-80 overflow-y-auto akuma-scroll font-mono text-[11px] space-y-0">
                    {logs
                      .filter(l => logFilter === "all" || l.type === logFilter)
                      .filter(l => !logSearch || (l.text || "").toLowerCase().includes(logSearch.toLowerCase()))
                      .map((log, i) => {
                        const time = log.ts ? new Date(log.ts).toLocaleTimeString("en-US", { hour12: false }) : "";
                        const colorClass = log.type === "stderr" ? "text-red-400" : log.type === "exit" ? "text-yellow-400" : log.type === "command" ? "text-cyan-400" : "text-green-400";
                        const badgeColor = log.type === "stderr" ? "bg-red-500/20 text-red-400" : log.type === "exit" ? "bg-yellow-500/20 text-yellow-400" : log.type === "command" ? "bg-cyan-500/20 text-cyan-400" : "bg-green-500/20 text-green-400";
                        return (
                          <div key={i} className="flex items-start gap-2 py-0.5 hover:bg-white/3 px-1 rounded group">
                            <span className="text-zinc-700 shrink-0 select-none">{time}</span>
                            <span className={cn("shrink-0 px-1 rounded text-[8px] uppercase font-bold", badgeColor)}>{log.type}</span>
                            <span className={cn("whitespace-pre-wrap break-all", colorClass)}>{log.text}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENV VARS VIEW */}
      {activeView === "env" && (
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

          {envs.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">
              {envLoading ? "Loading..." : "No env vars found"}
            </p>
          ) : (
            <div className="space-y-1.5">
              {envs.map(e => (
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
      )}

      {/* PROJECT INFO VIEW */}
      {activeView === "project" && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="size-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Project Info</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoCard label="Production URL" value={PROJECT_URL} link />
            <InfoCard label="Project Name" value="akuma-joki" />
            <InfoCard label="Framework" value="Next.js" />
            <InfoCard label="Repository" value="luminarydearx/akuma-joki" link="https://github.com/luminarydearx/akuma-joki" />
            <InfoCard label="Branch" value="main" />
            <InfoCard label="Token Env" value="akuma_joki_token" mono />
          </div>
          <div className="glass rounded-xl p-3 mt-3">
            <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Quick Links</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/20 transition-all">
                <ExternalLink className="size-3" /> Live Site
              </a>
              <a href="https://github.com/luminarydearx/akuma-joki" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition-all">
                <GitBranch className="size-3" /> GitHub
              </a>
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition-all">
                <ExternalLink className="size-3" /> Vercel Dashboard
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono, badge, avatar }: { icon: typeof Code; label: string; value: string; mono?: boolean; badge?: boolean; avatar?: string | null }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
      <Icon className="size-3.5 text-zinc-500 shrink-0" />
      <span className="text-[11px] text-zinc-500 uppercase tracking-wider w-20 shrink-0">{label}</span>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {avatar && <img src={avatar} alt="" className="size-4 rounded-full" />}
        <span className={cn("text-sm text-zinc-100 truncate", mono && "font-mono text-cyan-400")}>
          {badge ? <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px] uppercase">{value}</span> : value}
        </span>
      </div>
    </div>
  );
}

function InfoCard({ label, value, link, mono }: { label: string; value: string; link?: boolean | string; mono?: boolean }) {
  const isLink = link === true || typeof link === "string";
  const href = typeof link === "string" ? link : value;
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">{label}</p>
      {isLink ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cn("text-sm text-cyan-400 hover:underline truncate block", mono && "font-mono")}>
          {value}
        </a>
      ) : (
        <p className={cn("text-sm text-zinc-100 truncate", mono && "font-mono")}>{value}</p>
      )}
    </div>
  );
}
