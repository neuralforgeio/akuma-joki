/**
 * API Route: /api/vercel/env
 *
 * Manage Vercel project environment variables.
 * GET: list all env vars
 * POST: add/update env var
 * DELETE: remove env var
 *
 * Pakai Vercel API v9 (projects/{id}/env).
 *
 * Note: Token value TIDAK dikembalikan (security).
 */

import { NextRequest, NextResponse } from "next/server";

const VERCEL_TOKEN = process.env.akuma_joki_token;
const PROJECT_NAME = "akuma-joki";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!VERCEL_TOKEN) {
    return NextResponse.json({ ok: false, error: "akuma_joki_token not configured" }, { status: 500 });
  }

  try {
    // Get project ID first
    const projRes = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(PROJECT_NAME)}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    if (!projRes.ok) {
      return NextResponse.json({ ok: false, error: `Project not found: ${projRes.status}` }, { status: 404 });
    }
    const projData = await projRes.json();
    const projectId = projData.id;

    // Get env vars
    const envRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    if (!envRes.ok) {
      return NextResponse.json({ ok: false, error: `Failed to get env vars: ${envRes.status}` }, { status: 502 });
    }
    const envData = await envRes.json();
    const envs = (envData.envs || []).map((e: any) => ({
      id: e.id,
      key: e.key,
      type: e.type,
      target: e.target,
      createdAt: e.createdAt,
      updatedBy: e.updatedBy?.username,
    }));

    return NextResponse.json({
      ok: true,
      projectId,
      projectName: PROJECT_NAME,
      envs,
      count: envs.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!VERCEL_TOKEN) {
    return NextResponse.json({ ok: false, error: "akuma_joki_token not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { key, value, target = ["production", "preview", "development"], type = "encrypted" } = body;

    if (!key || !value) {
      return NextResponse.json({ ok: false, error: "key & value required" }, { status: 400 });
    }

    const projRes = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(PROJECT_NAME)}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    if (!projRes.ok) return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
    const projData = await projRes.json();
    const projectId = projData.id;

    const createRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, value, type, target }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ ok: false, error: `Failed: ${createRes.status} ${err.slice(0, 200)}` }, { status: 502 });
    }
    const result = await createRes.json();
    return NextResponse.json({
      ok: true,
      id: result.id,
      key: result.key,
      message: `Env var '${key}' added.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!VERCEL_TOKEN) {
    return NextResponse.json({ ok: false, error: "akuma_joki_token not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const envId = searchParams.get("id");
    if (!envId) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

    const projRes = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(PROJECT_NAME)}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    if (!projRes.ok) return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
    const projData = await projRes.json();
    const projectId = projData.id;

    const delRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${envId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });

    if (!delRes.ok) {
      const err = await delRes.text();
      return NextResponse.json({ ok: false, error: `Failed: ${delRes.status} ${err.slice(0, 200)}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true, message: "Env var deleted." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
