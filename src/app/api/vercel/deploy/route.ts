/**
 * API Route: /api/vercel/deploy
 *
 * Trigger new deployment di Vercel (redeploy latest, atau dari git commit).
 * Pakai Vercel API v13 (create deployment).
 *
 * Body:
 *   { action: "redeploy" | "deploy-git", ref?: string }  // ref = git commit sha or branch
 */

import { NextRequest, NextResponse } from "next/server";

const VERCEL_TOKEN = process.env.akuma_joki_token;
const PROJECT_NAME = "akuma-joki";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!VERCEL_TOKEN) {
    return NextResponse.json({ ok: false, error: "akuma_joki_token not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, ref } = body as { action: "redeploy" | "deploy-git"; ref?: string };

    if (action === "redeploy") {
      // Get latest deployment untuk dapat deployment ID
      const depRes = await fetch(
        `https://api.vercel.com/v6/deployments?app=${encodeURIComponent(PROJECT_NAME)}&limit=1&state=LATEST`,
        { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
      );
      if (!depRes.ok) {
        return NextResponse.json({ ok: false, error: `Failed to get latest deployment: ${depRes.status}` }, { status: 502 });
      }
      const depData = await depRes.json();
      const latest = depData.deployments?.[0];
      if (!latest) {
        return NextResponse.json({ ok: false, error: "No previous deployment found" }, { status: 404 });
      }

      // Redeploy
      const redeployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: PROJECT_NAME,
          deploymentId: latest.uid,
          target: "production",
        }),
      });

      if (!redeployRes.ok) {
        const err = await redeployRes.text();
        return NextResponse.json({ ok: false, error: `Redeploy failed: ${redeployRes.status} ${err.slice(0, 200)}` }, { status: 502 });
      }
      const result = await redeployRes.json();
      return NextResponse.json({
        ok: true,
        deploymentId: result.id,
        url: result.url,
        state: result.status || result.state,
        message: "Redeploy triggered. Check status in a few minutes.",
      });
    }

    if (action === "deploy-git") {
      // Deploy from git ref (branch or commit sha)
      const deployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: PROJECT_NAME,
          gitSource: {
            type: "github",
            ref: ref || "main",
            repoId: "luminarydearx/akuma-joki",
          },
          target: "production",
        }),
      });

      if (!deployRes.ok) {
        const err = await deployRes.text();
        return NextResponse.json({ ok: false, error: `Deploy failed: ${deployRes.status} ${err.slice(0, 200)}` }, { status: 502 });
      }
      const result = await deployRes.json();
      return NextResponse.json({
        ok: true,
        deploymentId: result.id,
        url: result.url,
        state: result.status || result.state,
        message: `Deploy from git ref '${ref || "main"}' triggered.`,
      });
    }

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
