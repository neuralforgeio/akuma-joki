"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/lib/admin-store";

/**
 * VisitorTracker — track visitor harian (localStorage, pure frontend).
 * Render sekali di root layout. Track 1x per session.
 */
export function VisitorTracker() {
  const trackVisitor = useAdminStore((s) => s.trackVisitor);

  useEffect(() => {
    const TRACKED = "akuma-visitor-tracked";
    try {
      if (!sessionStorage.getItem(TRACKED)) {
        trackVisitor();
        sessionStorage.setItem(TRACKED, "1");
      }
    } catch {
      /* ignore */
    }
  }, [trackVisitor]);

  return null;
}
