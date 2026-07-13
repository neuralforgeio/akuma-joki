/**
 * API Route: /api/vercel/logs
 *
 * Get deployment build logs (latest deployment, atau by deploymentId).
 * Pakai Vercel API v6 (deployments/{id}/events).
 *
 * Query: ?deploymentId=xxx&limit=50
 */

import { NextRequest, NextResponse } from "next/server";

const VERCEL_TOKEN = process.env.akuma_joki_token;
const PROJECT_NAME = "akuma-joki";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!VERCEL_TOKEN) {
    return NextResponse.json({ ok: false, error: "akuma_joki_token not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let deploymentId = searchParams.get("deploymentId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Jika tidak ada deploymentId, ambil latest
    if (!deploymentId) {
      const depRes = await fetch(
        `https://api.vercel.com/v6/deployments?app=${encodeURIComponent(PROJECT_NAME)}&limit=1`,
        { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
      );
      if (!depRes.ok) {
        return NextResponse.json({ ok: false, error: `Failed to get latest deployment: ${depRes.status}` }, { status: 502 });
      }
      const depData = await depRes.json();
      deploymentId = depData.deployments?.[0]?.uid;
      if (!deploymentId) {
        return NextResponse.json({ ok: false, error: "No deployment found" }, { status: 404 });
      }
    }

    // Get deployment events (logs) — pakai v3 (v6 return "Invalid API version")
    const logsRes = await fetch(
      `https://api.vercel.com/v3/deployments/${deploymentId}/events?limit=${limit}&types=stdout,stderr,command,exit`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );

    if (!logsRes.ok) {
      const err = await logsRes.text();
      return NextResponse.json({ ok: false, error: `Failed to get logs: ${logsRes.status} ${err.slice(0, 200)}` }, { status: 502 });
    }

    const logsData = await logsRes.json();
    const logs = (logsData || []).map((e: any) => ({
      type: e.type,
      text: e.text || e.payload?.text || "",
      ts: e.created,
      created: e.created,
    }));

    return NextResponse.json({
      ok: true,
      deploymentId,
      logs,
      count: logs.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
