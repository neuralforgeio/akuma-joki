/**
 * API Route: /api/vercel/clear-cache
 *
 * 🔒 REVISED: TIDAK push ke GitHub lagi (mencegah auto-deploy Vercel).
 *
 * Sekarang hanya return timestamp untuk confirm request diterima.
 * Refresh data sudah ditangani oleh useAutoSync hook yang polling
 * /api/synced-data setiap 60s — tidak perlu GitHub push.
 *
 * Jika admin ingin trigger immediate refresh di semua device,
 * gunakan command `sync-now` di dev-console (yang call triggerSync
 * dengan data change nyata, bukan dummy cache-bust file).
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({
    ok: true,
    timestamp: Date.now(),
    message: "Refresh request acknowledged. useAutoSync will fetch latest data within 60s. No GitHub push (prevents auto-deploy).",
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: Date.now(),
    note: "Use /api/synced-data for actual data polling.",
  });
}
