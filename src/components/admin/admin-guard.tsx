"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, refreshSession } from "@/lib/auth";

/**
 * AdminGuard — wrap halaman admin yang butuh auth.
 * Jika belum login → redirect ke /admin/login.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    // Perpanjang session (refresh expiry 7 hari) setiap kali admin navigasi
    refreshSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(true);
  }, [router, pathname]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="font-pixel text-[10px] uppercase text-[#a020f0] animate-pulse">
          Memuat...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
