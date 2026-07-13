"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import {
  Database, Copy, Gamepad2, Package, Settings, Activity, Users,
  Star, Inbox, FileImage, GitCommit, Megaphone, Power, HelpCircle,
  MessageSquare, Trash2, ChevronDown, ChevronRight, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "games" | "orders" | "reviews" | "reports" | "visitors" | "activity" | "commits" | "artifacts" | "settings" | "faq" | "waReplies" | "announcement" | "takedown";

const TABS: { id: Tab; label: string; icon: typeof Database }[] = [
  { id: "overview", label: "Overview", icon: Database },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "orders", label: "Orders", icon: Package },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "reports", label: "Reports", icon: Inbox },
  { id: "visitors", label: "Visitors", icon: Users },
  { id: "activity", label: "Activity Log", icon: Activity },
  { id: "commits", label: "Commits", icon: GitCommit },
  { id: "artifacts", label: "Artifacts", icon: FileImage },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "waReplies", label: "WA Replies", icon: MessageSquare },
  { id: "announcement", label: "Announcement", icon: Megaphone },
  { id: "takedown", label: "Takedown", icon: Power },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function copyToClipboard(text: string) {
  try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
}

export default function DevDataPage() {
  const state = useAdminStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gradient">Data Inspector</h1>
        <p className="mt-1 text-sm text-zinc-500">Inspect semua data di admin store dalam format readable.</p>
      </div>

      {/* Tab pills */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => {
          const Icon = t.icon;
          const count = (() => {
            if (t.id === "games") return state.games.length;
            if (t.id === "orders") return state.orders.length;
            if (t.id === "reviews") return state.reviews.length;
            if (t.id === "reports") return state.reports.length;
            if (t.id === "visitors") return state.visitors.length;
            if (t.id === "activity") return state.activityLog.length;
            if (t.id === "commits") return state.commits.length;
            if (t.id === "artifacts") return state.artifacts.length;
            if (t.id === "faq") return state.faq.length;
            if (t.id === "waReplies") return state.waReplies.length;
            return null;
          })();
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                tab === t.id ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
              {count !== null && <span className="ml-1 text-[9px] opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Search (for list tabs) */}
      {["games", "orders", "reviews", "reports", "activity", "commits", "faq", "waReplies"].includes(tab) && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search in ${tab}...`}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500/40"
          />
        </div>
      )}

      <div className="glass rounded-2xl p-5">
        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="size-4 text-cyan-400" />
                <span className="text-sm text-zinc-300">Store Overview</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatBox label="Games" value={state.games.length} icon={Gamepad2} color="#a020f0" />
              <StatBox label="Total Items" value={state.games.reduce((a, g) => a + g.categories.reduce((b, c) => b + c.items.length, 0), 0)} icon={Package} color="#22d3ee" />
              <StatBox label="Orders" value={state.orders.length} icon={Package} color="#fbbf24" />
              <StatBox label="Reviews" value={state.reviews.length} icon={Star} color="#fbbf24" />
              <StatBox label="Reports" value={state.reports.length} icon={Inbox} color="#f97316" />
              <StatBox label="Visitors (total)" value={state.visitors.reduce((a, v) => a + v.count, 0)} icon={Users} color="#7fd4ff" />
              <StatBox label="Commits" value={state.commits.length} icon={GitCommit} color="#ffd166" />
              <StatBox label="Artifacts" value={state.artifacts.length} icon={FileImage} color="#a78bfa" />
              <StatBox label="FAQ Items" value={state.faq.length} icon={HelpCircle} color="#6ee7b7" />
              <StatBox label="WA Replies" value={state.waReplies.length} icon={MessageSquare} color="#22d3ee" />
              <StatBox label="Activity Log" value={state.activityLog.length} icon={Activity} color="#ff6ad5" />
              <StatBox label="Announcement" value={state.announcement ? "Active" : "None"} icon={Megaphone} color={state.announcement ? "#10b981" : "#71717a"} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="glass rounded-xl p-4">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-2">Sync Status</p>
                <p className="text-sm text-zinc-100">Takedown: <span className={state.takedown ? "text-red-400" : "text-green-400"}>{state.takedown ? "ON" : "OFF"}</span></p>
                <p className="text-sm text-zinc-100">Hydrated: <span className={state._hasHydrated ? "text-green-400" : "text-yellow-400"}>{state._hasHydrated ? "Yes" : "No"}</span></p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-2">Settings</p>
                <p className="text-sm text-zinc-100 truncate">WA: <span className="font-mono text-cyan-400">{state.settings.whatsappNumber}</span></p>
                <p className="text-sm text-zinc-100 truncate">CS: <span className="text-zinc-300">{state.settings.csName}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* GAMES */}
        {tab === "games" && (
          <div className="space-y-3">
            {state.games.length === 0 ? <Empty /> : state.games
              .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.slug.includes(search.toLowerCase()))
              .map(g => {
                const itemsCount = g.categories.reduce((a, c) => a + c.items.length, 0);
                const isExpanded = expandedId === g.slug;
                return (
                  <div key={g.slug} className="glass rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : g.slug)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/3 transition-colors text-left"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg" style={{ borderColor: g.accent + "40", backgroundColor: g.accent + "10" }}>{g.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-100 font-medium truncate">{g.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">/{g.slug} · {g.tagline}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        <span>{g.categories.length} cat</span>
                        <span>{itemsCount} items</span>
                        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-white/5 p-3 space-y-3 bg-black/20">
                        <p className="text-[10px] text-zinc-500">{g.description}</p>
                        {g.notice && (
                          <div className="glass rounded-lg p-2 border-amber-500/20">
                            <p className="text-[10px] text-amber-400 font-semibold">{g.notice.title}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{g.notice.body}</p>
                          </div>
                        )}
                        {g.categories.map(c => (
                          <div key={c.id} className="glass rounded-lg p-2">
                            <p className="text-xs text-zinc-300 font-medium">{c.icon} {c.name} <span className="text-[9px] text-zinc-600">({c.items.length})</span></p>
                            <div className="mt-1.5 space-y-0.5">
                              {c.items.map(it => (
                                <div key={it.id} className="flex items-center gap-2 text-[10px] py-0.5">
                                  <span className="text-zinc-400 flex-1 truncate">{it.name}</span>
                                  {it.tag && <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[8px]">{it.tag}</span>}
                                  <span className="text-cyan-400 font-mono">{it.priceLabel}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="space-y-2">
            {state.orders.length === 0 ? <Empty /> : state.orders
              .filter(o => !search || o.productName.toLowerCase().includes(search.toLowerCase()) || o.gameName.toLowerCase().includes(search.toLowerCase()) || o.username.includes(search.toLowerCase()))
              .map(o => (
                <div key={o.id} className="glass rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/30 text-[10px] font-mono text-violet-400">{o.id.slice(-4)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-zinc-100 font-medium truncate">{o.productName}</p>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                          o.status === "new" ? "bg-yellow-500/10 text-yellow-400" :
                          o.status === "processing" ? "bg-cyan-500/10 text-cyan-400" :
                          o.status === "done" ? "bg-green-500/10 text-green-400" :
                          "bg-red-500/10 text-red-400")}>{o.status}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{o.gameName} · {o.priceLabel}</p>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-zinc-600">
                        <span>👤 {o.username}</span>
                        {o.customerWA && <span>📞 {o.customerWA}</span>}
                        <span>🕒 {formatDate(o.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* REVIEWS */}
        {tab === "reviews" && (
          <div className="space-y-2">
            {state.reviews.length === 0 ? <Empty /> : state.reviews
              .filter(r => !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.gameName.toLowerCase().includes(search.toLowerCase()) || r.comment.toLowerCase().includes(search.toLowerCase()))
              .map(r => (
                <div key={r.id} className="glass rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400">{r.rating}★</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-100 font-medium">{r.customerName}</p>
                      <p className="text-[10px] text-zinc-500">{r.gameName} · {r.productName}</p>
                      <p className="text-xs text-zinc-400 mt-1.5 italic">"{r.comment}"</p>
                      <p className="text-[10px] text-zinc-600 mt-1">🕒 {formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* REPORTS */}
        {tab === "reports" && (
          <div className="space-y-2">
            {state.reports.length === 0 ? <Empty /> : state.reports
              .filter(r => !search || r.subject.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase()))
              .map(r => (
                <div key={r.id} className="glass rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-bold uppercase",
                      r.type === "bug" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                      r.type === "suggestion" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                      r.type === "question" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
                      "bg-orange-500/10 border-orange-500/30 text-orange-400")}>{r.type[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-zinc-100 font-medium truncate">{r.subject}</p>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full uppercase",
                          r.status === "new" ? "bg-yellow-500/10 text-yellow-400" :
                          r.status === "read" ? "bg-cyan-500/10 text-cyan-400" :
                          "bg-green-500/10 text-green-400")}>{r.status}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{r.name} {r.contact && `· ${r.contact}`}</p>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{r.description}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">🕒 {formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* VISITORS */}
        {tab === "visitors" && (
          <div className="space-y-2">
            {state.visitors.length === 0 ? <Empty /> : (
              <>
                <div className="glass rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Total Visitors</span>
                  <span className="text-lg font-bold text-cyan-400">{state.visitors.reduce((a, v) => a + v.count, 0)}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {state.visitors.map(v => (
                    <div key={v.date} className="glass rounded-xl p-3">
                      <p className="text-[10px] text-zinc-500">{v.date}</p>
                      <p className="text-lg font-bold text-zinc-100 mt-1">{v.count}</p>
                      <p className="text-[9px] text-zinc-600">visitors</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ACTIVITY LOG */}
        {tab === "activity" && (
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto akuma-scroll">
            {state.activityLog.length === 0 ? <Empty /> : state.activityLog
              .filter(a => !search || a.action.toLowerCase().includes(search.toLowerCase()) || a.detail.toLowerCase().includes(search.toLowerCase()))
              .map(a => (
                <div key={a.id} className="flex items-start gap-3 border-l-2 border-violet-500/40 pl-3 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">{a.action}</p>
                    <p className="text-xs text-zinc-400 truncate">{a.detail}</p>
                  </div>
                  <span className="text-[9px] text-zinc-600 shrink-0">{formatDate(a.timestamp)}</span>
                </div>
              ))}
          </div>
        )}

        {/* COMMITS */}
        {tab === "commits" && (
          <div className="space-y-2">
            {state.commits.length === 0 ? <Empty /> : state.commits
              .filter(c => !search || c.message.toLowerCase().includes(search.toLowerCase()) || c.author.toLowerCase().includes(search.toLowerCase()))
              .map(c => (
                <div key={c.id} className="glass rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <GitCommit className="size-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-100">{c.message}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{c.author} · {formatDate(c.timestamp)}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Snapshot: {c.snapshot.games.length} games · {c.snapshot.announcement ? "announcement on" : "no announcement"} · takedown {c.snapshot.takedown ? "on" : "off"}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ARTIFACTS */}
        {tab === "artifacts" && (
          <div className="space-y-2">
            {state.artifacts.length === 0 ? <Empty /> : state.artifacts.map(a => (
              <div key={a.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <FileImage className="size-5 text-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 truncate">{a.name}</p>
                  <p className="text-[10px] text-zinc-500">{a.type} · {(a.size / 1024).toFixed(1)} KB · {formatDate(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="space-y-3">
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">WhatsApp Number</p>
              <p className="text-sm text-zinc-100 font-mono">{state.settings.whatsappNumber}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">CS Name</p>
              <p className="text-sm text-zinc-100">{state.settings.csName}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">CS Avatar</p>
              <p className="text-sm text-zinc-100">{state.settings.csAvatar ? "Set (base64)" : "Not set"}</p>
            </div>
          </div>
        )}

        {/* FAQ */}
        {tab === "faq" && (
          <div className="space-y-2">
            {state.faq.length === 0 ? <Empty /> : state.faq
              .filter(f => !search || f.question.toLowerCase().includes(search.toLowerCase()))
              .map(f => (
                <div key={f.id} className="glass rounded-xl p-3">
                  <p className="text-sm text-zinc-100 font-medium">Q: {f.question}</p>
                  <p className="text-xs text-zinc-400 mt-1">A: {f.answer}</p>
                </div>
              ))}
          </div>
        )}

        {/* WA REPLIES */}
        {tab === "waReplies" && (
          <div className="space-y-2">
            {state.waReplies.length === 0 ? <Empty /> : state.waReplies.map((r, i) => (
              <div key={i} className="glass rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100">{r.label} <span className="text-[9px] text-zinc-600">[{r.kind}]</span></p>
                  <p className="text-[10px] text-zinc-500 truncate">{r.reply || r.autoKey || "-"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENT */}
        {tab === "announcement" && (
          state.announcement ? (
            <div className="space-y-3">
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Title</p>
                <p className="text-sm text-zinc-100">{state.announcement.title}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Type</p>
                <p className="text-sm text-zinc-100 capitalize">{state.announcement.type} · {state.announcement.active ? "Active" : "Inactive"}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Body</p>
                <p className="text-sm text-zinc-400 whitespace-pre-wrap">{state.announcement.body}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Created</p>
                <p className="text-sm text-zinc-100">{formatDate(state.announcement.createdAt)}</p>
              </div>
            </div>
          ) : <Empty text="No announcement set" />
        )}

        {/* TAKEDOWN */}
        {tab === "takedown" && (
          <div className="space-y-3">
            <div className="glass rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Status</p>
                <p className={cn("text-sm font-bold", state.takedown ? "text-red-400" : "text-green-400")}>{state.takedown ? "🔴 ON (Maintenance)" : "🟢 OFF (Live)"}</p>
              </div>
              <Power className={cn("size-8", state.takedown ? "text-red-400" : "text-green-400")} />
            </div>
            {state.takedownReason && (
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1">Reason</p>
                <p className="text-sm text-zinc-100">{state.takedownReason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof Database; color: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase text-zinc-500 tracking-wider">{label}</span>
        <Icon className="size-3.5" style={{ color }} />
      </div>
      <p className="text-lg font-bold text-zinc-100 mt-1">{value}</p>
    </div>
  );
}

function Empty({ text }: { text?: string }) {
  return (
    <div className="py-12 text-center">
      <Database className="mx-auto size-10 text-zinc-700 mb-3" />
      <p className="text-sm text-zinc-500">{text || "No data found"}</p>
    </div>
  );
}
