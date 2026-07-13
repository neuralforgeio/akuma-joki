/**
 * API Route: /api/vercel/cancel
 *
 * Cancel deployment yang sedang building/queued.
 * Pakai Vercel API v13 (PATCH deployment state → CANCELED).
 *
 * Body: { deploymentId }
 */

import { NextRequest, NextResponse } from "next/server";

const VERCEL_TOKEN = process.env.akuma_joki_token;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!VERCEL_TOKEN) {
    return NextResponse.json({ ok: false, error: "akuma_joki_token not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { deploymentId } = body;

    if (!deploymentId) {
      return NextResponse.json({ ok: false, error: "deploymentId required" }, { status: 400 });
    }

    // Cancel deployment via PATCH state
    const cancelRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: "CANCELED" }),
    });

    if (!cancelRes.ok) {
      const err = await cancelRes.text();
      return NextResponse.json({ ok: false, error: `Cancel failed: ${cancelRes.status} ${err.slice(0, 300)}` }, { status: 502 });
    }

    const result = await cancelRes.json();
    return NextResponse.json({
      ok: true,
      deploymentId,
      state: result.state,
      message: `Deployment ${deploymentId.slice(0, 12)} canceled.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
