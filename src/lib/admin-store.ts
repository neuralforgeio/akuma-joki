/**
 * AKUMA JOKI — Admin Store (Zustand + persist localStorage)
 *
 * Single source of truth untuk semua data yang dikelola admin dashboard:
 * - games (CRUD, override DEFAULT_GAMES)
 * - announcement (global banner)
 * - takedown (maintenance mode toggle)
 * - orders (inbox dari checkout)
 * - commits (version snapshots untuk rollback)
 * - activityLog (audit trail)
 * - visitors (counter)
 * - settings (WA number, dll)
 * - templates (WA widget quick-reply)
 * - faq (FAQ auto-reply)
 * - artifacts (file base64)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GAMES as DEFAULT_GAMES,
  WHATSAPP_NUMBER as DEFAULT_WA,
  SYNCED_GAMES,
  SYNCED_ANNOUNCEMENT,
  SYNCED_TAKEDOWN,
  SYNCED_TAKEDOWN_REASON,
  SYNCED_SETTINGS,
  SYNCED_FAQ,
  SYNCED_ABOUT,
  SYNCED_REVIEWS,
  SYNCED_REPORTS,
  DEFAULT_ABOUT,
} from "./games-data";
import type { Game, AboutContent, Review, ContactReport } from "./games-data";
import { scheduleGitHubSync } from "./github-sync";

/* ============================ Types ============================ */
export type Announcement = {
  id: string;
  title: string;
  body: string;
  type: "warning" | "info" | "success";
  active: boolean;
  createdAt: number;
};

export type Order = {
  id: string;
  gameName: string;
  productName: string;
  priceLabel: string;
  username: string;
  password: string;
  customerWA?: string;
  note?: string;
  status: "new" | "processing" | "done" | "cancelled";
  createdAt: number;
};

export type CommitEntry = {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  snapshot: {
    games: Game[];
    announcement: Announcement | null;
    takedown: boolean;
  };
};

export type ActivityEntry = {
  id: string;
  action: string;
  detail: string;
  timestamp: number;
};

export type VisitorEntry = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type Artifact = {
  id: string;
  name: string;
  type: string; // mime type
  size: number;
  dataUrl: string; // base64 data URL
  createdAt: number;
};

export type WAReply = {
  label: string;
  emoji: string;
  kind: "auto" | "redirect";
  autoKey?: string;
  reply?: string;
};

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export type Notification = {
  id: string;
  type: "order_new" | "order_status" | "review_new" | "report_new" | "system";
  title: string;
  message: string;
  targetRole: "admin" | "developer" | "all";
  targetUser?: string; // username for user-specific notif
  link?: string;
  read: boolean;
  createdAt: number;
};

export type AdminSettings = {
  whatsappNumber: string;
  csName: string;
  /** Avatar CS (base64 data URL, hasil crop). Dipakai di WA widget. */
  csAvatar?: string;
};

/* ============================ Store ============================ */
type AdminState = {
  /* data */
  games: Game[];
  announcement: Announcement | null;
  takedown: boolean;
  takedownReason: string;
  orders: Order[];
  commits: CommitEntry[];
  activityLog: ActivityEntry[];
  visitors: VisitorEntry[];
  artifacts: Artifact[];
  waReplies: WAReply[];
  faq: FAQItem[];
  about: AboutContent;
  reviews: Review[];
  reports: ContactReport[];
  notifications: Notification[];
  settings: AdminSettings;
  _hasHydrated: boolean;

  /* hydration */
  setHasHydrated: (v: boolean) => void;

  /* games CRUD */
  addGame: (game: Game) => void;
  updateGame: (slug: string, game: Partial<Game>) => void;
  deleteGame: (slug: string) => void;
  addCategory: (slug: string, cat: { id: string; name: string; icon: string }) => void;
  deleteCategory: (slug: string, catId: string) => void;
  addItem: (slug: string, catId: string, item: { id: string; name: string; price: number; priceLabel: string; tag?: string; description?: string; requirement?: string }) => void;
  updateItem: (slug: string, catId: string, itemId: string, item: Partial<{ id: string; name: string; price: number; priceLabel: string; tag?: string; description?: string; requirement?: string }>) => void;
  deleteItem: (slug: string, catId: string, itemId: string) => void;

  /* announcement */
  setAnnouncement: (a: Announcement | null) => void;

  /* takedown */
  setTakedown: (on: boolean, reason?: string) => void;

  /* orders */
  addOrder: (o: Omit<Order, "id" | "createdAt" | "status">) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  deleteOrder: (id: string) => void;

  /* commits */
  createCommit: (message: string, author: string) => void;
  rollbackCommit: (commitId: string) => void;

  /* activity log */
  logActivity: (action: string, detail: string) => void;

  /* sync ke GitHub */
  triggerSync: (commitMessage?: string) => void;

  /* visitors */
  trackVisitor: () => void;

  /* artifacts */
  addArtifact: (a: Omit<Artifact, "id" | "createdAt">) => void;
  deleteArtifact: (id: string) => void;

  /* WA replies */
  setWAReplies: (r: WAReply[]) => void;

  /* FAQ */
  addFAQ: (q: string, a: string) => void;
  updateFAQ: (id: string, q: string, a: string) => void;
  deleteFAQ: (id: string) => void;

  /* about */
  setAbout: (a: AboutContent) => void;

  /* reviews */
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
  deleteReview: (id: string) => void;

  /* reports (contact reports) */
  addReport: (r: Omit<ContactReport, "id" | "createdAt" | "status">) => void;
  updateReportStatus: (id: string, status: ContactReport["status"]) => void;
  deleteReport: (id: string) => void;

  /* notifications */
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;

  /* sync from server (GitHub raw) */
  syncFromServer: (data: Partial<{
    games: Game[];
    announcement: Announcement | null;
    takedown: boolean;
    takedownReason: string;
    settings: AdminSettings;
    faq: FAQItem[];
    waReplies: WAReply[];
    about: AboutContent;
    reviews: Review[];
    reports: ContactReport[];
    notifications: Notification[];
  }>) => void;

  /* settings */
  updateSettings: (s: Partial<AdminSettings>) => void;

  /* reset */
  resetAll: () => void;
};

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      games: SYNCED_GAMES,
      announcement: SYNCED_ANNOUNCEMENT,
      takedown: SYNCED_TAKEDOWN,
      takedownReason: SYNCED_TAKEDOWN_REASON,
      orders: [],
      commits: [],
      activityLog: [],
      visitors: [],
      artifacts: [],
      waReplies: [],
      faq: SYNCED_FAQ,
      about: SYNCED_ABOUT,
      reviews: SYNCED_REVIEWS,
      reports: SYNCED_REPORTS,
      notifications: [],
      settings: SYNCED_SETTINGS,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      /* ===== games CRUD ===== */
      addGame: (game) => {
        set((s) => ({ games: [...s.games, game] }));
        get().logActivity("ADD_GAME", `Tambah game: ${game.name}`);
        get().triggerSync(`Add game: ${game.name}`);
      },
      updateGame: (slug, game) => {
        set((s) => ({
          games: s.games.map((g) => (g.slug === slug ? { ...g, ...game } : g)),
        }));
        get().logActivity("UPDATE_GAME", `Edit game: ${slug}`);
        get().triggerSync(`Update game: ${slug}`);
      },
      deleteGame: (slug) => {
        set((s) => ({ games: s.games.filter((g) => g.slug !== slug) }));
        get().logActivity("DELETE_GAME", `Hapus game: ${slug}`);
        get().triggerSync(`Delete game: ${slug}`);
      },
      addCategory: (slug, cat) => {
        set((s) => ({
          games: s.games.map((g) =>
            g.slug === slug
              ? { ...g, categories: [...g.categories, { ...cat, items: [] }] }
              : g
          ),
        }));
        get().logActivity("ADD_CATEGORY", `Tambah kategori ${cat.name} di ${slug}`);
        get().triggerSync(`Add category ${cat.name} to ${slug}`);
      },
      deleteCategory: (slug, catId) => {
        set((s) => ({
          games: s.games.map((g) =>
            g.slug === slug
              ? { ...g, categories: g.categories.filter((c) => c.id !== catId) }
              : g
          ),
        }));
        get().logActivity("DELETE_CATEGORY", `Hapus kategori ${catId} di ${slug}`);
        get().triggerSync(`Delete category ${catId} from ${slug}`);
      },
      addItem: (slug, catId, item) => {
        set((s) => ({
          games: s.games.map((g) =>
            g.slug === slug
              ? {
                  ...g,
                  categories: g.categories.map((c) =>
                    c.id === catId ? { ...c, items: [...c.items, item] } : c
                  ),
                }
              : g
          ),
        }));
        get().logActivity("ADD_ITEM", `Tambah item ${item.name} di ${slug}`);
        get().triggerSync(`Add item ${item.name} to ${slug}`);
      },
      updateItem: (slug, catId, itemId, item) => {
        set((s) => ({
          games: s.games.map((g) =>
            g.slug === slug
              ? {
                  ...g,
                  categories: g.categories.map((c) =>
                    c.id === catId
                      ? {
                          ...c,
                          items: c.items.map((it) =>
                            it.id === itemId ? { ...it, ...item } : it
                          ),
                        }
                      : c
                  ),
                }
              : g
          ),
        }));
        get().logActivity("UPDATE_ITEM", `Edit item ${itemId} di ${slug}`);
      },
      deleteItem: (slug, catId, itemId) => {
        set((s) => ({
          games: s.games.map((g) =>
            g.slug === slug
              ? {
                  ...g,
                  categories: g.categories.map((c) =>
                    c.id === catId
                      ? { ...c, items: c.items.filter((it) => it.id !== itemId) }
                      : c
                  ),
                }
              : g
          ),
        }));
        get().logActivity("DELETE_ITEM", `Hapus item ${itemId} di ${slug}`);
        get().triggerSync(`Delete item ${itemId} from ${slug}`);
      },

      /* ===== announcement ===== */
      setAnnouncement: (a) => {
        set({ announcement: a });
        if (a) get().logActivity("SET_ANNOUNCEMENT", `Set: ${a.title}`);
        else get().logActivity("CLEAR_ANNOUNCEMENT", "Hapus announcement");
        get().triggerSync(a ? `Set announcement: ${a.title}` : "Clear announcement");
      },

      /* ===== takedown ===== */
      setTakedown: (on, reason) => {
        set((s) => ({
          takedown: on,
          takedownReason: reason ?? s.takedownReason,
        }));
        // set cookie untuk middleware bisa baca (per-browser)
        try {
          document.cookie = `akuma-takedown=${on ? "1" : "0"}; path=/; max-age=${
            60 * 60 * 24 * 365
          }; SameSite=Lax`;
        } catch {
          /* ignore */
        }
        get().logActivity("TAKEDOWN", `Takedown ${on ? "ON" : "OFF"}`);
        get().triggerSync(`Takedown ${on ? "ON" : "OFF"}`);
      },

      /* ===== orders ===== */
      addOrder: (o) => {
        const order: Order = {
          ...o,
          id: uid(),
          createdAt: Date.now(),
          status: "new",
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        // Auto-create notification for admin
        get().addNotification({
          type: "order_new",
          title: "Order Baru Masuk!",
          message: `${order.productName} (${order.gameName}) - ${order.priceLabel} oleh ${order.username}`,
          targetRole: "all",
          link: "/admin/pesanan",
        });
      },
      updateOrderStatus: (id, status) => {
        const order = get().orders.find(o => o.id === id);
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));
        get().logActivity("ORDER_STATUS", `Order ${id} → ${status}`);
        // Auto-create notification for user if order exists
        if (order) {
          get().addNotification({
            type: "order_status",
            title: "Status Order Diperbarui",
            message: `Order ${order.productName} sekarang: ${status.toUpperCase()}`,
            targetRole: "all",
            targetUser: order.username,
            link: `/track-order`,
          });
        }
      },
      deleteOrder: (id) => {
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
      },

      /* ===== commits ===== */
      createCommit: (message, author) => {
        const s = get();
        const entry: CommitEntry = {
          id: uid(),
          message,
          author,
          timestamp: Date.now(),
          snapshot: {
            games: JSON.parse(JSON.stringify(s.games)),
            announcement: s.announcement
              ? JSON.parse(JSON.stringify(s.announcement))
              : null,
            takedown: s.takedown,
          },
        };
        set((st) => ({ commits: [entry, ...st.commits].slice(0, 50) }));
        get().logActivity("COMMIT", message);
      },
      rollbackCommit: (commitId) => {
        const entry = get().commits.find((c) => c.id === commitId);
        if (!entry) return;
        set({
          games: JSON.parse(JSON.stringify(entry.snapshot.games)),
          announcement: entry.snapshot.announcement
            ? JSON.parse(JSON.stringify(entry.snapshot.announcement))
            : null,
          takedown: entry.snapshot.takedown,
        });
        get().logActivity("ROLLBACK", `Rollback ke commit ${commitId}`);
      },

      /* ===== activity log ===== */
      logActivity: (action, detail) => {
        const entry: ActivityEntry = {
          id: uid(),
          action,
          detail,
          timestamp: Date.now(),
        };
        set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 200) }));
      },

      /* ===== trigger sync ke GitHub ===== */
      // Helper internal: kirim data terbaru ke GitHub (debounced).
      // Dipanggil setelah setiap mutation (addGame, updateGame, dll).
      triggerSync: (commitMessage?: string) => {
        const s = get();
        const payload = {
          games: s.games,
          announcement: s.announcement,
          takedown: s.takedown,
          takedownReason: s.takedownReason,
          settings: s.settings,
          faq: s.faq,
          waReplies: s.waReplies,
          about: s.about,
          reviews: s.reviews,
          reports: s.reports,
          notifications: s.notifications,
          version: 1,
          updatedAt: new Date().toISOString(),
        };
        scheduleGitHubSync(payload, commitMessage);
      },

      /* ===== visitors ===== */
      trackVisitor: () => {
        const today = todayStr();
        const visitors = get().visitors;
        const existing = visitors.find((v) => v.date === today);
        if (existing) {
          set({
            visitors: visitors.map((v) =>
              v.date === today ? { ...v, count: v.count + 1 } : v
            ),
          });
        } else {
          set({ visitors: [...visitors, { date: today, count: 1 }] });
        }
      },

      /* ===== artifacts ===== */
      addArtifact: (a) => {
        const art: Artifact = { ...a, id: uid(), createdAt: Date.now() };
        set((s) => ({ artifacts: [art, ...s.artifacts] }));
        get().logActivity("ADD_ARTIFACT", `Upload: ${a.name}`);
      },
      deleteArtifact: (id) => {
        set((s) => ({ artifacts: s.artifacts.filter((a) => a.id !== id) }));
      },

      /* ===== WA replies ===== */
      setWAReplies: (r) => {
        set({ waReplies: r });
        get().logActivity("UPDATE_TEMPLATES", "Update WA templates");
        get().triggerSync("Update WA templates");
      },

      /* ===== FAQ ===== */
      addFAQ: (q, a) => {
        const item: FAQItem = { id: uid(), question: q, answer: a };
        set((s) => ({ faq: [...s.faq, item] }));
        get().logActivity("ADD_FAQ", q);
        get().triggerSync(`Add FAQ: ${q}`);
      },
      updateFAQ: (id, q, a) => {
        set((s) => ({
          faq: s.faq.map((f) => (f.id === id ? { ...f, question: q, answer: a } : f)),
        }));
      },
      deleteFAQ: (id) => {
        set((s) => ({ faq: s.faq.filter((f) => f.id !== id) }));
      },

      /* ===== about ===== */
      setAbout: (a) => {
        const withTs = { ...a, updatedAt: Date.now() };
        set({ about: withTs });
        get().logActivity("UPDATE_ABOUT", `Update About: ${a.title}`);
        get().triggerSync(`Update About page: ${a.title}`);
      },

      /* ===== reviews ===== */
      addReview: (r) => {
        const review: Review = {
          ...r,
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          createdAt: Date.now(),
        };
        set((s) => ({ reviews: [review, ...s.reviews] }));
        get().logActivity("ADD_REVIEW", `${r.customerName} → ${r.gameName} (${r.rating}★)`);
        // Auto-create notification
        get().addNotification({
          type: "review_new",
          title: "Review Baru!",
          message: `${r.customerName} memberi ${r.rating}★ untuk ${r.gameName}`,
          targetRole: "all",
          link: `/store/${r.gameSlug}`,
        });
        get().triggerSync(`Add review: ${r.customerName} → ${r.gameName}`);
      },
      deleteReview: (id) => {
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) }));
        get().logActivity("DELETE_REVIEW", `Hapus review ${id}`);
        get().triggerSync(`Delete review ${id}`);
      },

      /* ===== reports (contact reports) ===== */
      addReport: (r) => {
        const report: ContactReport = {
          ...r,
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          status: "new",
          createdAt: Date.now(),
        };
        set((s) => ({ reports: [report, ...s.reports] }));
        get().logActivity("ADD_REPORT", `${r.type.toUpperCase()}: ${r.subject}`);
        // Auto-create notification for admin/dev
        get().addNotification({
          type: "report_new",
          title: `Laporan ${r.type}: ${r.subject}`,
          message: `Dari ${r.name}: ${r.description.slice(0, 80)}${r.description.length > 80 ? "..." : ""}`,
          targetRole: "developer",
          link: "/admin/reports",
        });
        get().triggerSync(`Add report: ${r.type} - ${r.subject}`);
      },
      updateReportStatus: (id, status) => {
        set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, status } : r)) }));
        get().logActivity("UPDATE_REPORT", `Report ${id} → ${status}`);
        get().triggerSync(`Update report ${id} → ${status}`);
      },
      deleteReport: (id) => {
        set((s) => ({ reports: s.reports.filter((r) => r.id !== id) }));
        get().logActivity("DELETE_REPORT", `Hapus report ${id}`);
        get().triggerSync(`Delete report ${id}`);
      },

      /* ===== notifications ===== */
      addNotification: (n) => {
        const notif: Notification = {
          ...n,
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          read: false,
          createdAt: Date.now(),
        };
        set((s) => ({ notifications: [notif, ...s.notifications].slice(0, 100) }));
      },
      markNotificationRead: (id) => {
        set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
      },
      markAllNotificationsRead: () => {
        set((s) => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) }));
      },
      deleteNotification: (id) => {
        set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) }));
      },

      /* ===== sync from server (GitHub raw) ===== */
      // Dipanggil oleh useAutoSync hook setiap 60 detik.
      // Update state dari server TANPA triggerSync (anti loop).
      syncFromServer: (data) => {
        set((s) => ({
          games: data.games ?? s.games,
          announcement: data.announcement !== undefined ? data.announcement : s.announcement,
          takedown: data.takedown !== undefined ? data.takedown : s.takedown,
          takedownReason: data.takedownReason ?? s.takedownReason,
          settings: data.settings ? { ...s.settings, ...data.settings } : s.settings,
          faq: data.faq ?? s.faq,
          waReplies: data.waReplies ?? s.waReplies,
          about: data.about ?? s.about,
          reviews: data.reviews ?? s.reviews,
          reports: data.reports ?? s.reports,
          notifications: data.notifications ?? s.notifications,
        }));
      },

      /* ===== settings ===== */
      updateSettings: (s) => {
        set((st) => ({ settings: { ...st.settings, ...s } }));
        get().logActivity("UPDATE_SETTINGS", JSON.stringify(s));
        get().triggerSync("Update settings");
      },

      /* ===== reset ===== */
      resetAll: () => {
        set({
          games: SYNCED_GAMES,
          announcement: SYNCED_ANNOUNCEMENT,
          takedown: SYNCED_TAKEDOWN,
          takedownReason: SYNCED_TAKEDOWN_REASON,
          orders: [],
          commits: [],
          activityLog: [],
          visitors: [],
          artifacts: [],
          waReplies: [],
          faq: SYNCED_FAQ,
          about: DEFAULT_ABOUT,
          reviews: SYNCED_REVIEWS,
          reports: SYNCED_REPORTS,
          settings: SYNCED_SETTINGS,
        });
        try {
          document.cookie = "akuma-takedown=0; path=/; max-age=0";
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: "akuma-admin-store",
      // Exclude fields yang sudah di-sync via GitHub (admin-data.json).
      // Field-field ini harus selalu dari server (build-time), BUKAN localStorage,
      // supaya cross-device consistent.
      // Field yang tetap di-persist: orders, commits, activityLog, visitors,
      // artifacts (data lokal admin dashboard).
      partialize: (state) => ({
        orders: state.orders,
        commits: state.commits,
        activityLog: state.activityLog,
        visitors: state.visitors,
        artifacts: state.artifacts,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** Hook: dapatkan game by slug dari admin store (fallback ke DEFAULT_GAMES). */
export function useGameBySlug(slug: string | null | undefined): Game | undefined {
  return useAdminStore((s) => s.games.find((g) => g.slug === slug));
}

/** Hook: total items semua game. */
export function useTotalItems(): number {
  return useAdminStore((s) =>
    s.games.reduce(
      (acc, g) => acc + g.categories.reduce((a, c) => a + c.items.length, 0),
      0
    )
  );
}
