"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, getSession, isDeveloper } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/akuma/notification-bell";
import {
  LayoutDashboard, Gamepad2, Megaphone, Power, Activity, BarChart3,
  Package, FileImage, GitCommit, MessageSquare, HelpCircle, Settings,
  LogOut, ChevronLeft, ChevronRight, Menu as MenuIcon, X,
  Code2, Terminal, Database, Webhook, ShieldAlert, Bug, Info, Inbox, Rocket,
} from "lucide-react";

type MenuItem = { href: string; label: string; icon: typeof LayoutDashboard; roles: ("developer" | "admin")[] };

const MENU: MenuItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["developer", "admin"] },
  { href: "/admin/games", label: "Games", icon: Gamepad2, roles: ["developer", "admin"] },
  { href: "/admin/announcement", label: "Announcement", icon: Megaphone, roles: ["developer", "admin"] },
  { href: "/admin/takedown", label: "Takedown", icon: Power, roles: ["developer", "admin"] },
  { href: "/admin/pemantauan", label: "Pemantauan", icon: Activity, roles: ["developer"] },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3, roles: ["developer", "admin"] },
  { href: "/admin/pesanan", label: "Pesanan", icon: Package, roles: ["developer", "admin"] },
  { href: "/admin/artifact", label: "Artifact", icon: FileImage, roles: ["developer"] },
  { href: "/admin/commit", label: "Commit", icon: GitCommit, roles: ["developer"] },
  { href: "/admin/templates", label: "WA Templates", icon: MessageSquare, roles: ["developer", "admin"] },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle, roles: ["developer", "admin"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["developer", "admin"] },
  { href: "/admin/game-analytics", label: "Game Analytics", icon: BarChart3, roles: ["developer"] },
  { href: "/admin/live-chat", label: "Live Chat", icon: MessageSquare, roles: ["developer", "admin"] },
  { href: "/admin/reports", label: "Reports", icon: Inbox, roles: ["developer", "admin"] },
  // Developer-only features
  { href: "/admin/about", label: "About Page", icon: Info, roles: ["developer"] },
  { href: "/admin/dev-vercel", label: "Vercel Control", icon: Rocket, roles: ["developer"] },
  { href: "/admin/dev-console", label: "Dev Console", icon: Terminal, roles: ["developer"] },
  { href: "/admin/dev-data", label: "Data Inspector", icon: Database, roles: ["developer"] },
  { href: "/admin/dev-webhooks", label: "Webhooks", icon: Webhook, roles: ["developer"] },
  { href: "/admin/dev-security", label: "Security Audit", icon: ShieldAlert, roles: ["developer"] },
  { href: "/admin/dev-debug", label: "Debug Logs", icon: Bug, roles: ["developer"] },
];

const COLLAPSE_KEY = "akuma-admin-sidebar-collapsed";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = getSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dev, setDev] = useState(false);

  useEffect(() => {
    try { // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* ignore */ }
    setDev(isDeveloper());
  }, []);

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false); }, [pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      window.dispatchEvent(new Event("akuma-sidebar-toggle"));
    } catch { /* ignore */ }
  };

  const handleLogout = () => { logout(); router.replace("/admin/login"); };

  // Filter menu by role
  const visibleMenu = MENU.filter((item) => {
    if (!session) return false;
    return item.roles.includes(session.role);
  });

  // Split: standard items vs developer items
  // Dev items = routes starting with /admin/dev- + /admin/about + /admin/reports
  const isDevItem = (href: string) =>
    href.startsWith("/admin/dev-") || href === "/admin/about";
  const standardItems = visibleMenu.filter((m) => !isDevItem(m.href));
  const devItems = visibleMenu.filter((m) => isDevItem(m.href));

  return (
    <>
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Buka sidebar"
          className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center border-2 border-[#a020f0] bg-[#0a0a0a] text-[#c44bff] pixel-corner shadow-[0_0_12px_rgba(160,32,240,0.4)] md:hidden"
        >
          <MenuIcon className="size-4" />
        </button>
      )}

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" aria-hidden />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r-2 border-[#a020f0]/40 bg-[#0a0a0a] scanlines transition-all duration-300",
          collapsed ? "md:w-16" : "md:w-56",
          mobileOpen ? "w-56 translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="relative border-b-2 border-[#a020f0]/40 px-4 py-4">
          <div className="flex items-center justify-between">
            {collapsed ? (
              <div className="hidden h-8 w-8 items-center justify-center border-2 border-[#a020f0] pixel-corner bg-[#a020f0]/10 md:flex">
                <span className="font-pixel text-[8px] text-[#c44bff]">A</span>
              </div>
            ) : (
              <Link href="/admin" className="block">
                <p className="font-pixel text-[10px] uppercase text-[#c44bff] text-glow-neon">AKUMA</p>
                <p className="font-pixel text-[8px] uppercase text-[#9a93a8] tracking-widest">
                  {dev ? "Dev Panel" : "Admin Panel"}
                </p>
              </Link>
            )}
            <button onClick={toggleCollapse} aria-label={collapsed ? "Expand" : "Collapse"}
              className="hidden h-6 w-6 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner hover:border-[#a020f0] hover:text-[#c44bff] transition-colors md:flex">
              {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
            </button>
            <button onClick={() => setMobileOpen(false)} aria-label="Tutup"
              className="flex h-6 w-6 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner hover:border-[#ff3b6b] hover:text-[#ff3b6b] transition-colors md:hidden">
              <X className="size-3" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {standardItems.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                className={cn("flex items-center gap-2.5 px-3 py-2.5 font-pixel text-[8px] uppercase tracking-wide pixel-corner transition-all",
                  collapsed && "md:justify-center md:px-0",
                  active ? "bg-[#a020f0]/20 text-[#c44bff] border-2 border-[#a020f0] shadow-[0_0_10px_rgba(160,32,240,0.4)]"
                         : "text-[#9a93a8] border-2 border-transparent hover:text-[#e5e5e5] hover:bg-[#a020f0]/10")}>
                <Icon className="size-3.5 shrink-0" />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Developer section */}
          {devItems.length > 0 && (!collapsed || mobileOpen) && (
            <div className="pt-3 pb-1 px-3">
              <p className="font-pixel text-[6px] uppercase tracking-widest text-[#a020f0]/60">Developer Tools</p>
            </div>
          )}
          {devItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                className={cn("flex items-center gap-2.5 px-3 py-2.5 font-pixel text-[8px] uppercase tracking-wide pixel-corner transition-all",
                  collapsed && "md:justify-center md:px-0",
                  active ? "bg-[#22d3ee]/20 text-[#22d3ee] border-2 border-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                         : "text-[#9a93a8] border-2 border-transparent hover:text-[#22d3ee] hover:bg-[#22d3ee]/10")}>
                <Icon className="size-3.5 shrink-0" />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t-2 border-[#a020f0]/40 px-3 py-3">
          {(!collapsed || mobileOpen) && (
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-pixel text-[7px] uppercase text-[#9a93a8]">Login as</p>
                <p className="font-pixel text-[8px] truncate" style={{ color: dev ? "#22d3ee" : "#6ee7b7" }}>
                  {session?.user ?? "admin"} ({dev ? "DEV" : "ADMIN"})
                </p>
              </div>
              <NotificationBell isAdmin />
            </div>
          )}
          {collapsed && !mobileOpen && (
            <div className="flex justify-center mb-2">
              <NotificationBell isAdmin />
            </div>
          )}
          <button onClick={handleLogout} title={collapsed && !mobileOpen ? "Logout" : undefined}
            className={cn("flex items-center gap-2 font-pixel text-[8px] uppercase text-[#ff3b6b] border-2 border-[#ff3b6b]/40 pixel-corner transition-all hover:bg-[#ff3b6b]/10",
              collapsed && !mobileOpen ? "md:w-full md:justify-center md:px-0 md:py-2.5" : "w-full px-3 py-2")}>
            <LogOut className="size-3" />
            {(!collapsed || mobileOpen) && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
