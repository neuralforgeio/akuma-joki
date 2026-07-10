"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, getSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Gamepad2,
  Megaphone,
  Power,
  Activity,
  BarChart3,
  Package,
  FileImage,
  GitCommit,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MENU = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/announcement", label: "Announcement", icon: Megaphone },
  { href: "/admin/takedown", label: "Takedown", icon: Power },
  { href: "/admin/pemantauan", label: "Pemantauan", icon: Activity },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/admin/pesanan", label: "Pesanan", icon: Package },
  { href: "/admin/artifact", label: "Artifact", icon: FileImage },
  { href: "/admin/commit", label: "Commit", icon: GitCommit },
  { href: "/admin/templates", label: "WA Templates", icon: MessageSquare },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const COLLAPSE_KEY = "akuma-admin-sidebar-collapsed";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = getSession();
  const [collapsed, setCollapsed] = useState(false);

  // load collapsed state from localStorage
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      window.dispatchEvent(new Event("akuma-sidebar-toggle"));
    } catch {
      /* ignore */
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r-2 border-[#a020f0]/40 bg-[#0a0a0a] scanlines transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* logo */}
      <div className="relative border-b-2 border-[#a020f0]/40 px-4 py-4">
        <div className="flex items-center justify-between">
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center border-2 border-[#a020f0] pixel-corner bg-[#a020f0]/10">
              <span className="font-pixel text-[8px] text-[#c44bff]">A</span>
            </div>
          ) : (
            <Link href="/admin" className="block">
              <p className="font-pixel text-[10px] uppercase text-[#c44bff] text-glow-neon">
                AKUMA
              </p>
              <p className="font-pixel text-[8px] uppercase text-[#9a93a8] tracking-widest">
                Admin Panel
              </p>
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-6 w-6 items-center justify-center border-2 border-[#2a2436] text-[#9a93a8] pixel-corner hover:border-[#a020f0] hover:text-[#c44bff] transition-colors"
          >
            {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
          </button>
        </div>
      </div>

      {/* menu */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {MENU.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 font-pixel text-[8px] uppercase tracking-wide pixel-corner transition-all",
                collapsed && "justify-center px-0",
                active
                  ? "bg-[#a020f0]/20 text-[#c44bff] border-2 border-[#a020f0] shadow-[0_0_10px_rgba(160,32,240,0.4)]"
                  : "text-[#9a93a8] border-2 border-transparent hover:text-[#e5e5e5] hover:bg-[#a020f0]/10"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* footer: user + logout */}
      <div className="border-t-2 border-[#a020f0]/40 px-3 py-3">
        {!collapsed && (
          <div className="mb-2">
            <p className="font-pixel text-[7px] uppercase text-[#9a93a8]">Login</p>
            <p className="font-pixel text-[8px] text-[#6ee7b7] truncate">
              {session?.user ?? "admin"}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center gap-2 font-pixel text-[8px] uppercase text-[#ff3b6b] border-2 border-[#ff3b6b]/40 pixel-corner transition-all hover:bg-[#ff3b6b]/10",
            collapsed ? "w-full justify-center px-0 py-2.5" : "w-full px-3 py-2"
          )}
        >
          <LogOut className="size-3" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
