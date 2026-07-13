"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, X, ShoppingCart, Star, Bug, Zap } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "@/lib/admin-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  order_new: ShoppingCart,
  order_status: Zap,
  review_new: Star,
  report_new: Bug,
  system: Bell,
};

const TYPE_COLOR = {
  order_new: "#10b981",
  order_status: "#22d3ee",
  review_new: "#fbbf24",
  report_new: "#f97316",
  system: "#a020f0",
};

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function NotificationBell({ isAdmin = false }: { isAdmin?: boolean }) {
  const notifications = useAdminStore((s) => s.notifications);
  const hydrated = useAdminStore((s) => s._hasHydrated);
  const markRead = useAdminStore((s) => s.markNotificationRead);
  const markAllRead = useAdminStore((s) => s.markAllNotificationsRead);
  const deleteNotif = useAdminStore((s) => s.deleteNotification);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Filter notifications for current context
  const visible = notifications.filter(n => {
    if (isAdmin) return n.targetRole === "all" || n.targetRole === "admin" || n.targetRole === "developer";
    return n.targetRole === "all"; // user only sees "all" notifications
  });
  const unreadCount = visible.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    visible.forEach(n => { if (!n.read) markRead(n.id); });
    toast({ title: "✅ All notifications marked as read" });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-all"
      >
        <Bell className="size-4" />
        {hydrated && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-nav-strong rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)] z-50 overflow-hidden border border-white/10"
            style={{ backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Notifications</h3>
                {unreadCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">{unreadCount} new</span>}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-green-400"
                >
                  <CheckCheck className="size-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto akuma-scroll">
              {visible.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="mx-auto size-8 text-zinc-700 mb-2" />
                  <p className="text-sm text-zinc-500">No notifications</p>
                </div>
              ) : (
                visible.slice(0, 20).map(n => {
                  const Icon = TYPE_ICON[n.type] || Bell;
                  const color = TYPE_COLOR[n.type] || "#a020f0";
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors hover:bg-white/3",
                        !n.read && "bg-violet-500/5"
                      )}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                        style={{ borderColor: color + "40", backgroundColor: color + "10" }}
                      >
                        <Icon className="size-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-100 truncate">{n.title}</p>
                          {!n.read && <span className="size-1.5 rounded-full bg-violet-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-zinc-600">{formatRelative(n.createdAt)}</span>
                          <div className="flex items-center gap-1">
                            {n.link && (
                              <Link
                                href={n.link}
                                onClick={() => { markRead(n.id); setOpen(false); }}
                                className="text-[9px] text-violet-400 hover:underline"
                              >
                                View →
                              </Link>
                            )}
                            {!n.read && (
                              <button
                                onClick={() => markRead(n.id)}
                                className="rounded p-1 text-zinc-500 hover:text-green-400"
                                aria-label="Mark read"
                              >
                                <Check className="size-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotif(n.id)}
                              className="rounded p-1 text-zinc-500 hover:text-red-400"
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
