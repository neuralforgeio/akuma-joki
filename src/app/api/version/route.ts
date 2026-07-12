import { NextResponse } from "next/server";

/**
 * /api/version — return current build version.
 * UpdateNotifier polls this every 60s to detect new deployments.
 * When Vercel deploys a new build, this endpoint returns a new buildId
 * (from Next.js build metadata), triggering the update notification.
 */
export function GET() {
  return NextResponse.json(
    {
      buildId: process.env.NEXT_BUILD_ID || Date.now().toString(),
      version: "2.0.5",
      deployedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
