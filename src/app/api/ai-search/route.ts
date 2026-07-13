/**
 * API Route: /api/ai-search
 *
 * AI-powered search menggunakan GLM (z-ai-web-dev-sdk).
 * Parse natural language query & return ranked items.
 *
 * Query: ?q=termurah+blox+fruits
 *
 * Flow:
 * 1. Get all games & items from GitHub (via /api/synced-data logic)
 * 2. Send query + items context to GLM
 * 3. GLM return ranked item IDs with relevance score
 * 4. Return matched items with AI explanation
 */

import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = "https://api.github.com/repos/luminarydearx/akuma-joki/contents/data/admin-data.json";

export const dynamic = "force-dynamic";

type SearchItem = {
  id: string;
  gameSlug: string;
  gameName: string;
  gameEmoji: string;
  gameAccent: string;
  productName: string;
  priceLabel: string;
  price: number;
  tag?: string;
  description?: string;
  category: string;
};

async function fetchAllItems(): Promise<SearchItem[]> {
  if (!GITHUB_TOKEN) return [];
  try {
    const res = await fetch(GITHUB_API_URL, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items: SearchItem[] = [];
    for (const game of data.games || []) {
      for (const cat of game.categories || []) {
        for (const item of cat.items || []) {
          items.push({
            id: `${game.slug}-${item.id}`,
            gameSlug: game.slug,
            gameName: game.name,
            gameEmoji: game.emoji,
            gameAccent: game.accent,
            productName: item.name,
            priceLabel: item.priceLabel,
            price: item.price || 0,
            tag: item.tag,
            description: item.description,
            category: cat.name,
          });
        }
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ ok: false, error: "Query too short (min 2 chars)" }, { status: 400 });
  }

  const items = await fetchAllItems();
  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: "No items available" }, { status: 404 });
  }

  try {
    const zai = await ZAI.create();

    // Build context: compact list of items
    const itemsContext = items.slice(0, 50).map((it, i) => 
      `${i + 1}. [${it.id}] ${it.gameName} - ${it.productName} (${it.priceLabel})${it.tag ? ` [${it.tag}]` : ""}${it.description ? ` - ${it.description.slice(0, 60)}` : ""}`
    ).join("\n");

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: "Kamu adalah asisten search untuk AKUMA JOKI (layanan joki game Roblox). User akan bertanya dengan natural language. Tugasmu: pilih item yang paling relevan dengan query user. Return JSON array of item IDs (format: 'gameSlug-itemId'). Max 5 items, diurutkan dari paling relevan. Jika query tentang harga, pilih yang sesuai. Jika tentang game tertentu, filter sesuai.",
        },
        {
          role: "user",
          content: `Query user: "${q}"\n\nDaftar item tersedia:\n${itemsContext}\n\nReturn JSON array of item IDs (max 5, paling relevan duluan). Format: ["blox-fruits-lvl-100", "blox-fruits-raid-1-10"]`,
        }
      ],
      thinking: { type: "disabled" },
    });

    const response = completion.choices?.[0]?.message?.content || "";

    // Parse JSON array from response
    const idMatch = response.match(/\[[\s\S]*?\]/);
    let matchedIds: string[] = [];
    if (idMatch) {
      try {
        matchedIds = JSON.parse(idMatch[0]);
      } catch { /* ignore parse error */ }
    }

    // Filter items by matched IDs
    const matched = matchedIds
      .map(id => items.find(it => it.id === id))
      .filter(Boolean) as SearchItem[];

    // Fallback: if AI returns nothing, do simple text match
    if (matched.length === 0) {
      const ql = q.toLowerCase();
      const fallback = items.filter(it =>
        it.productName.toLowerCase().includes(ql) ||
        it.gameName.toLowerCase().includes(ql) ||
        (it.description || "").toLowerCase().includes(ql) ||
        (it.tag || "").toLowerCase().includes(ql)
      ).slice(0, 5);
      return NextResponse.json({
        ok: true,
        query: q,
        results: fallback,
        count: fallback.length,
        source: "fallback",
        aiResponse: response.slice(0, 200),
      });
    }

    return NextResponse.json({
      ok: true,
      query: q,
      results: matched,
      count: matched.length,
      source: "ai",
      aiResponse: response.slice(0, 200),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Fallback to simple search on AI error
    const ql = q.toLowerCase();
    const fallback = items.filter(it =>
      it.productName.toLowerCase().includes(ql) ||
      it.gameName.toLowerCase().includes(ql) ||
      (it.description || "").toLowerCase().includes(ql)
    ).slice(0, 5);
    return NextResponse.json({
      ok: true,
      query: q,
      results: fallback,
      count: fallback.length,
      source: "fallback",
      error: msg,
    });
  }
}
