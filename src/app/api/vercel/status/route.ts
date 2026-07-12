/**
 * API Route: /api/vercel/status
 *
 * Get Vercel deployment status (latest deployment info).
 * Pakai Vercel API v6.
 *
 * Env: akuma_joki_token (Vercel access token, di-set di Vercel project settings)
 */

import { NextResponse } from "next/server";

const VERCEL_TOKEN = process.env.akuma_joki_token;
const PROJECT_NAME = "akuma-joki";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!VERCEL_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "akuma_joki_token not configured. Add to .env (local) or Vercel env vars." },
      { status: 500 }
    );
  }

  try {
    // Get user/team info first untuk dapat team ID
    const userRes = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });
    if (!userRes.ok) {
      const err = await userRes.text();
      return NextResponse.json({ ok: false, error: `Vercel auth failed: ${userRes.status} ${err.slice(0, 200)}` }, { status: 401 });
    }
    const userData = await userRes.json();
    const username = userData.user?.username;

    // Get project deployments (latest 5)
    const depRes = await fetch(
      `https://api.vercel.com/v6/deployments?app=${encodeURIComponent(PROJECT_NAME)}&limit=5&state=LATEST`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    let deployments = [];
    if (depRes.ok) {
      const depData = await depRes.json();
      deployments = (depData.deployments || []).map((d: any) => ({
        uid: d.uid,
        url: d.url,
        state: d.state,
        created: d.created,
        ready: d.ready,
        source: d.source,
        commit: d.meta?.githubCommitMessage || d.meta?.commitMessage || null,
        branch: d.meta?.githubCommitRef || d.branch || null,
        author: d.creator?.username || null,
        target: d.target,
      }));
    }

    // Get project info
    let project = null;
    try {
      const projRes = await fetch(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(PROJECT_NAME)}`,
        { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
      );
      if (projRes.ok) {
        const projData = await projRes.json();
        project = {
          id: projData.id,
          name: projData.name,
          framework: projData.framework,
          latestDeployment: projData.latestDeployments?.[0]
            ? {
                url: projData.latestDeployments[0].url,
                state: projData.latestDeployments[0].state,
                created: projData.latestDeployments[0].createdAt,
              }
            : null,
          targets: projData.targets,
        };
      }
    } catch { /* ignore project fetch error */ }

    return NextResponse.json({
      ok: true,
      username,
      project,
      deployments,
      timestamp: Date.now(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
