/**
 * API Route: /api/sync-github
 *
 * Menerima data dari admin dashboard, push ke GitHub sebagai data/admin-data.json.
 * Token dibaca dari process.env.GITHUB_TOKEN (TIDAK diekspos ke client).
 *
 * Setelah push, Vercel auto-redeploy → perubahan live di semua visitor.
 */

import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "neuralforgeio";
const GITHUB_REPO = process.env.GITHUB_REPO || "akuma-joki";
const FILE_PATH = "data/admin-data.json";

export async function POST(request: NextRequest) {
  // Cek token ada
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN not configured. Add it to .env (local) or Vercel env vars." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { data, commitMessage } = body as { data: unknown; commitMessage?: string };

    if (!data) {
      return NextResponse.json({ error: "Missing 'data' field" }, { status: 400 });
    }

    const content = JSON.stringify(data, null, 2);
    const encodedContent = Buffer.from(content, "utf-8").toString("base64");

    const msg =
      commitMessage ||
      `chore(data): sync admin dashboard changes [${new Date().toISOString()}]`;

    // 1. Get current file sha (needed for update)
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

    // 2. Push update
    const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: msg,
        content: encodedContent,
        sha, // jika undefined = create new file, jika ada = update existing
        branch: "main",
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return NextResponse.json(
        { error: `GitHub API error: ${putRes.status}`, detail: errText },
        { status: 502 }
      );
    }

    const result = await putRes.json();
    return NextResponse.json({
      success: true,
      commit: {
        sha: result.commit?.sha,
        message: result.commit?.message,
        url: result.commit?.html_url,
      },
      note: "Vercel akan auto-redeploy dalam 1-2 menit. Perubahan live setelah deploy selesai.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/sync-github",
    method: "POST",
    description: "Sync admin dashboard data to GitHub (data/admin-data.json)",
    configured: !!GITHUB_TOKEN,
    repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
  });
}
