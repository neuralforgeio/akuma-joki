"use client";

import { useAutoSync } from "@/lib/use-auto-sync";

/**
 * AutoSyncClient — client component that runs useAutoSync hook.
 * Separated from MainLayout so MainLayout can be a Server Component.
 */
export function AutoSyncClient() {
  useAutoSync();
  return null;
}
