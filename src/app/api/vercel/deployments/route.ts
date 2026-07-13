/**
 * API Route: /api/vercel/deployments
 *
 * List semua deployments Vercel dengan details (state, commit, logs URL, dll).
 * Pakai Vercel API v6.
 *
 * Query: ?limit=20&state=ERROR|READY|BUILDING
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const state = searchParams.get("state");

    let url = `https://api.vercel.com/v6/deployments?app=${encodeURIComponent(PROJECT_NAME)}&limit=${limit}`;
    if (state) url += `&state=${state}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ ok: false, error: `Failed: ${res.status} ${err.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const deployments = (data.deployments || []).map((d: any) => ({
      uid: d.uid,
      url: d.url,
      state: d.state,
      created: d.created,
      ready: d.ready,
      building: d.building,
      source: d.source,
      commit: d.meta?.githubCommitMessage || d.meta?.commitMessage || null,
      commitSha: d.meta?.githubCommitSha || d.meta?.commitSha || null,
      commitRef: d.meta?.githubCommitRef || d.meta?.commitRef || d.branch || null,
      author: d.creator?.username || d.creator?.email || null,
      authorAvatar: d.creator?.githubLogin ? `https://github.com/${d.creator.githubLogin}.png?size=40` : null,
      target: d.target,
      alias: d.alias || [],
      inspectorUrl: d.inspectorUrl,
      memoryUsage: d.memoryUsage,
      checks: d.readyState === "READY",
      duration: d.ready && d.created ? d.ready - d.created : null,
    }));

    return NextResponse.json({
      ok: true,
      deployments,
      count: deployments.length,
      pagination: data.pagination,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
