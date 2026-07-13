/**
 * API Route: /api/vercel/deploy
 *
 * Trigger deployment di Vercel:
 * - action: "redeploy" → redeploy existing deployment (latest atau by ID)
 * - action: "deploy-git" → deploy dari git ref (branch/commit)
 * - action: "rollback" → instant rollback ke deployment tertentu (by ID)
 * - action: "promote" → promote deployment ke production (sama dengan rollback, create new prod deployment from specified one)
 *
 * Note: Vercel API tidak punya endpoint /promote (404). Jadi rollback & promote
 * menggunakan approach "create new deployment from old one with target=production".
 * Ini efektif sama: membuat deployment baru dengan code yang sama, di production.
 *
 * Body:
 *   { action, deploymentId?, ref? }
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
    const { action, deploymentId, ref } = body as {
      action: "redeploy" | "deploy-git" | "rollback" | "promote";
      deploymentId?: string;
      ref?: string;
    };

    const headers = {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    };

    // === REDEPLOY / ROLLBACK / PROMOTE: semua pakai approach "create new deployment from old one" ===
    // - redeploy: latest atau by ID
    // - rollback: by ID (instant rollback ke versi tertentu)
    // - promote: by ID (promote ke production)
    if (action === "redeploy" || action === "rollback" || action === "promote") {
      let depId = deploymentId;

      // Jika tidak ada deploymentId (redeploy tanpa ID), ambil latest production
      if (!depId) {
        if (action !== "redeploy") {
          return NextResponse.json({ ok: false, error: `deploymentId required for ${action}` }, { status: 400 });
        }
        const depRes = await fetch(
          `https://api.vercel.com/v6/deployments?app=${encodeURIComponent(PROJECT_NAME)}&limit=5&target=production`,
          { headers }
        );
        if (!depRes.ok) {
          const e = await depRes.text();
          return NextResponse.json({ ok: false, error: `Failed to get latest deployment: ${depRes.status} ${e.slice(0, 200)}` }, { status: 502 });
        }
        const depData = await depRes.json();
        const latest = depData.deployments?.find((d: any) => d.state === "READY") || depData.deployments?.[0];
        if (!latest) {
          return NextResponse.json({ ok: false, error: "No previous deployment found to redeploy" }, { status: 404 });
        }
        depId = latest.uid;
      }

      // Create new deployment from old one (redeploy approach)
      const redeployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: PROJECT_NAME,
          deploymentId: depId,
          target: "production",
        }),
      });

      if (!redeployRes.ok) {
        const err = await redeployRes.text();
        return NextResponse.json({ ok: false, error: `${action} failed: ${redeployRes.status} ${err.slice(0, 300)}` }, { status: 502 });
      }
      const result = await redeployRes.json();

      const messages: Record<string, string> = {
        redeploy: `Redeploy triggered dari deployment ${depId.slice(0, 12)}.`,
        rollback: `✅ Rollback ke deployment ${depId.slice(0, 12)} triggered. New production deployment dibuat dengan code yang sama.`,
        promote: `✅ Deployment ${depId.slice(0, 12)} promoted to production.`,
      };

      return NextResponse.json({
        ok: true,
        deploymentId: result.id,
        url: result.url,
        state: result.status || result.state,
        message: messages[action],
      });
    }

    // === DEPLOY-GIT: deploy dari git ref (branch or commit) ===
    if (action === "deploy-git") {
      // Get project info dulu untuk dapat projectId
      const projRes = await fetch(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(PROJECT_NAME)}`,
        { headers }
      );
      if (!projRes.ok) {
        const e = await projRes.text();
        return NextResponse.json({ ok: false, error: `Project not found: ${projRes.status} ${e.slice(0, 200)}` }, { status: 502 });
      }
      const projData = await projRes.json();

      // Cek apakah project punya git integration
      if (!projData.link || projData.link.type !== "github") {
        return NextResponse.json({
          ok: false,
          error: "Project belum connect ke GitHub repo. Connect via Vercel dashboard dulu.",
        }, { status: 400 });
      }

      // Pakai ref dari project link (org + repo)
      const gitSource = {
        type: "github",
        org: projData.link.org,
        repo: projData.link.repo,
        ref: ref || projData.link.deployedBranch || "main",
      };

      // Jika ref adalah commit SHA (40 char hex), pakai sha field
      if (ref && /^[a-f0-9]{40}$/i.test(ref)) {
        delete gitSource.ref;
        (gitSource as any).sha = ref;
      }

      const deployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: PROJECT_NAME,
          gitSource,
          target: "production",
        }),
      });

      if (!deployRes.ok) {
        const err = await deployRes.text();
        return NextResponse.json({ ok: false, error: `Deploy failed: ${deployRes.status} ${err.slice(0, 300)}` }, { status: 502 });
      }
      const result = await deployRes.json();
      return NextResponse.json({
        ok: true,
        deploymentId: result.id,
        url: result.url,
        state: result.status || result.state,
        message: `Deploy dari git ref '${ref || projData.link.deployedBranch || "main"}' triggered.`,
      });
    }

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
