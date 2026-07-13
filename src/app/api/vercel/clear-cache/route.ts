/**
 * API Route: /api/vercel/clear-cache
 *
 * 🔒 REVISED: Sekarang hanya trigger data refresh (TIDAK clear localStorage,
 *    TIDAK reload page). Cukup update timestamp supaya useAutoSync detect
 *    perubahan & syncFromServer jalan.
 *
 * Cara kerja baru:
 * 1. Admin klik "refresh-data" di dev-console
 * 2. POST ke sini → push updated admin-data.json (touch updatedAt) ke GitHub
 * 3. Semua client polling /api/synced-data → detect updatedAt beda
 * 4. useAutoSync call syncFromServer(data) → state update → React re-render
 * 5. TIDAK ada reload, TIDAK ada localStorage.clear
 *
 * Body: { reason?: string }
 */

import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "luminarydearx";
const GITHUB_REPO = "akuma-joki";
const FILE_PATH = "data/cache-bust.json";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Manual refresh by admin";
    const timestamp = Date.now();

    const payload = {
      refreshSignal: timestamp,
      reason,
      refreshedAt: new Date().toISOString(),
    };

    const content = JSON.stringify(payload, null, 2);
    const encodedContent = Buffer.from(content, "utf-8").toString("base64");

    // Get current file sha (for update)
    const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    let sha: string | undefined;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // Push update (touch file untuk trigger sync)
    const putRes = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore(refresh): trigger data refresh - ${reason} [${new Date().toISOString()}]`,
        content: encodedContent,
        sha,
        branch: "main",
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return NextResponse.json({ ok: false, error: `GitHub API error: ${putRes.status} ${errText.slice(0, 200)}` }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      refreshSignal: timestamp,
      reason,
      message: "Refresh signal pushed. Semua device akan re-fetch data dalam 60s (no reload, no cache clear).",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  // Get current refresh signal (for client polling — optional, not used anymore)
  try {
    const res = await fetch(
      `https://api.github.com/repos/luminarydearx/akuma-joki/contents/${FILE_PATH}`,
      {
        cache: "no-store",
        headers: {
          Authorization: GITHUB_TOKEN ? `Bearer ${GITHUB_TOKEN}` : "",
          Accept: "application/vnd.github.raw+json",
        },
      }
    );
    if (!res.ok) {
      return NextResponse.json({ ok: false, refreshSignal: 0 });
    }
    const data = await res.json();
    return NextResponse.json({
      ok: true,
      refreshSignal: data.refreshSignal || 0,
      reason: data.reason,
      refreshedAt: data.refreshedAt,
    });
  } catch {
    return NextResponse.json({ ok: false, refreshSignal: 0 });
  }
}
