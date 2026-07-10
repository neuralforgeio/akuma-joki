"use client";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminSidebar } from "@/components/admin/sidebar";

/**
 * Layout untuk semua route /admin/* (kecuali /admin/login yang punya layout sendiri).
 * Sidebar kiri + main content kanan, tema dark pixel-art Akuma.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0a0a0a]">
        <AdminSidebar />
        <main className="ml-56 min-h-screen p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
