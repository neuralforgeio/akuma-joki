"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isDeveloper } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { HelpBanner } from "@/components/admin/help-tooltip";
import { Bug, Lightbulb, HelpCircle, AlertTriangle, Trash2, CheckCircle2, Eye, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportType = "bug" | "suggestion" | "question" | "complaint";
type ReportStatus = "new" | "read" | "resolved";

type StoredReport = {
  id: string;
  name: string;
  contact: string;
  type: ReportType;
  subject: string;
  description: string;
  page: string;
  status: ReportStatus;
  createdAt: number;
};

const REPORTS_KEY = "akuma-contact-reports";

const TYPE_META: Record<ReportType, { label: string; icon: typeof Bug; color: string }> = {
  bug: { label: "Bug", icon: Bug, color: "#ef4444" },
  suggestion: { label: "Saran", icon: Lightbulb, color: "#fbbf24" },
  question: { label: "Pertanyaan", icon: HelpCircle, color: "#22d3ee" },
  complaint: { label: "Keluhan", icon: AlertTriangle, color: "#f97316" },
};

const STATUS_META: Record<ReportStatus, { label: string; color: string; bg: string }> = {
  new: { label: "Baru", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  read: { label: "Dibaca", color: "#22d3ee", bg: "rgba(34,211,238,0.1)" },
  resolved: { label: "Selesai", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
};

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ReportsAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [filter, setFilter] = useState<"all" | ReportType | ReportStatus>("all");
  const [selected, setSelected] = useState<StoredReport | null>(null);

  useEffect(() => {
    if (!isDeveloper()) {
      toast({ title: "Akses ditolak: developer only", variant: "destructive" });
      router.replace("/admin");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthorized(true);
    try {
      const data: StoredReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
      setReports(data);
    } catch {
      setReports([]);
    }
  }, [router, toast]);

  const persist = (next: StoredReport[]) => {
    setReports(next);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(next.slice(0, 100)));
  };

  const updateStatus = (id: string, status: ReportStatus) => {
    persist(reports.map((r) => (r.id === id ? { ...r, status } : r)));
    if (selected?.id === id) setSelected({ ...selected, status });
    toast({ title: `Status → ${STATUS_META[status].label}` });
  };

  const remove = (id: string) => {
    if (!confirm("Hapus laporan ini?")) return;
    persist(reports.filter((r) => r.id !== id));
    if (selected?.id === id) setSelected(null);
    toast({ title: "Laporan dihapus" });
  };

  const clearAll = () => {
    if (!confirm("Hapus SEMUA laporan? Tidak bisa diundo.")) return;
    persist([]);
    setSelected(null);
    toast({ title: "Semua laporan dihapus" });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(reports, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `akuma-reports-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast({ title: "Reports di-export!" });
  };

  const filtered = reports.filter((r) => {
    if (filter === "all") return true;
    if (["bug", "suggestion", "question", "complaint"].includes(filter)) return r.type === filter;
    return r.status === filter;
  });

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="font-pixel text-xs uppercase text-violet-400 animate-pulse">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: reports.length,
    new: reports.filter((r) => r.status === "new").length,
    bug: reports.filter((r) => r.type === "bug").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="space-y-5">
      <HelpBanner
        title="Reports"
        description="Laporan bug, saran, pertanyaan, dan keluhan dari halaman /contact (disimpan lokal di browser user)."
        tips={[
          "Laporan dikirim dari form /contact oleh pengunjung",
          "Data tersimpan di localStorage browser user (akuma-contact-reports)",
          "Admin bisa lihat, ubah status, hapus, dan export",
          "Status: Baru → Dibaca → Selesai",
          "Note: data laporan TIDAK otomatis sync antar browser user",
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gradient">Contact Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">{stats.total} laporan · {stats.new} baru · {stats.bug} bug · {stats.resolved} selesai</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            disabled={reports.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <Download className="size-4" /> Export
          </button>
          <button
            onClick={clearAll}
            disabled={reports.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 className="size-4" /> Clear All
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500 mr-1">
          <Filter className="size-3.5" /> Filter:
        </span>
        {[
          { id: "all", label: `Semua (${stats.total})` },
          { id: "new", label: `Baru (${stats.new})` },
          { id: "bug", label: `Bug (${stats.bug})` },
          { id: "suggestion", label: "Saran" },
          { id: "question", label: "Tanya" },
          { id: "complaint", label: "Keluhan" },
          { id: "resolved", label: `Selesai (${stats.resolved})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs transition-all border",
              filter === f.id
                ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                : "bg-white/3 border-white/8 text-zinc-400 hover:text-zinc-200 hover:border-white/15"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Bug className="mx-auto size-10 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">
            {reports.length === 0 ? "Belum ada laporan masuk." : "Tidak ada laporan untuk filter ini."}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">
            Laporan akan muncul di sini ketika user submit form di /contact
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const typeMeta = TYPE_META[r.type];
            const statusMeta = STATUS_META[r.status];
            const TypeIcon = typeMeta.icon;
            return (
              <div
                key={r.id}
                className={cn(
                  "glass rounded-2xl p-4 transition-all hover:border-white/15",
                  selected?.id === r.id && "border-violet-500/40 bg-violet-500/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{ borderColor: typeMeta.color + "40", backgroundColor: typeMeta.color + "10" }}
                  >
                    <TypeIcon className="size-5" style={{ color: typeMeta.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-zinc-100 truncate">{r.subject}</h3>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                      >
                        {statusMeta.label}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border"
                        style={{ color: typeMeta.color, borderColor: typeMeta.color + "40" }}
                      >
                        {typeMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{r.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-zinc-600">
                      <span>👤 {r.name}</span>
                      {r.contact && <span>📞 {r.contact}</span>}
                      <span>🕒 {formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setSelected(r);
                        if (r.status === "new") updateStatus(r.id, "read");
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-white/5 transition-all"
                      aria-label="Lihat detail"
                    >
                      <Eye className="size-4" />
                    </button>
                    {r.status !== "resolved" && (
                      <button
                        onClick={() => updateStatus(r.id, "resolved")}
                        className="rounded-lg p-1.5 text-zinc-400 hover:text-green-400 hover:bg-white/5 transition-all"
                        aria-label="Tandai selesai"
                      >
                        <CheckCircle2 className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => remove(r.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-all"
                      aria-label="Hapus"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-strong rounded-3xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto akuma-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const Icon = TYPE_META[selected.type].icon;
                  return (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                      style={{ borderColor: TYPE_META[selected.type].color + "40", backgroundColor: TYPE_META[selected.type].color + "10" }}
                    >
                      <Icon className="size-5" style={{ color: TYPE_META[selected.type].color }} />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-zinc-100 truncate">{selected.subject}</h2>
                  <p className="text-[10px] text-zinc-500">{formatDate(selected.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3">
                  <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Nama</p>
                  <p className="text-zinc-100">{selected.name}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Kontak</p>
                  <p className="text-zinc-100">{selected.contact || "-"}</p>
                </div>
              </div>

              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Deskripsi</p>
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
              </div>

              {selected.page && (
                <div className="glass rounded-xl p-3">
                  <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Halaman</p>
                  <p className="text-zinc-400 text-xs break-all">{selected.page}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <select
                  value={selected.status}
                  onChange={(e) => updateStatus(selected.id, e.target.value as ReportStatus)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/40"
                >
                  <option value="new" className="bg-[#0a0a0a]">Baru</option>
                  <option value="read" className="bg-[#0a0a0a]">Dibaca</option>
                  <option value="resolved" className="bg-[#0a0a0a]">Selesai</option>
                </select>
                <button
                  onClick={() => remove(selected.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="size-4" /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
