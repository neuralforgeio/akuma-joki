/**
 * API Route: /api/synced-data
 *
 * Fetch data/admin-data.json terbaru dari GitHub repo (private) via GitHub API.
 *
 * Kenapa perlu server-side proxy?
 *  1. Repo private → butuh token (GITHUB_TOKEN), tidak bisa fetch raw langsung dari client
 *  2. Avoid CORS issue
 *  3. Bisa add cache control headers (no-store) supaya selalu fresh
 *  4. Token tetap aman di server, tidak expose ke client
 *
 * Response: JSON admin-data (games, reviews, about, faq, settings, dll)
 * dengan header Cache-Control: no-store (selalu fetch fresh).
 */

import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "luminarydearx";
const GITHUB_REPO = "akuma-joki";
const FILE_PATH = "data/admin-data.json";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error: "GITHUB_TOKEN not configured. Add it to .env (local) or Vercel env vars.",
        source: "github-api",
      },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(GITHUB_API_URL, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          ok: false,
          error: `GitHub API fetch failed: ${res.status} ${errText.slice(0, 200)}`,
          source: "github-api",
        },
        { status: 502 }
      );
    }

    // Response body = raw file content (karena Accept: raw+json)
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Failed to parse JSON from GitHub", source: "github-api" },
        { status: 502 }
      );
    }

    const dataObj = data as { updatedAt?: string };
    return NextResponse.json(
      {
        ok: true,
        source: "github-api",
        updatedAt: dataObj.updatedAt ?? null,
        data,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: msg, source: "github-api" },
      { status: 500 }
    );
  }
}
