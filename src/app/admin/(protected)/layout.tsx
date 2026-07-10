"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/sidebar";

const COLLAPSE_KEY = "akuma-admin-sidebar-collapsed";

// Inject meta noindex untuk admin pages (sembunyikan dari search engine)
// Ini dilakukan client-side karena layout adalah client component.
function NoIndexMeta() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
  return null;
}

/**
 * Layout untuk semua route /admin/* (kecuali /admin/login yang punya layout sendiri).
 * Sidebar kiri (collapsible) + main content kanan, tema dark pixel-art Akuma.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
      } catch {
        /* ignore */
      }
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("akuma-sidebar-toggle", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("akuma-sidebar-toggle", sync);
    };
  }, []);

  return (
    <AdminGuard>
      <NoIndexMeta />
      <div className="min-h-screen bg-[#0a0a0a]">
        <AdminSidebar />
        <main
          className={`min-h-screen p-4 sm:p-6 transition-all duration-300 ${
            collapsed ? "md:ml-16" : "md:ml-56"
          }`}
        >
          <div className="mx-auto max-w-6xl pt-12 md:pt-0">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
