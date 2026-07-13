/**
 * API Route: /api/ai-search
 *
 * Smart search — parse natural language query & return ranked items.
 * NO GLM/SDK needed. Pure algorithmic search.
 *
 * Query: ?q=joki+termurah
 *
 * Logic:
 * 1. Fetch all items from GitHub (admin-data.json)
 * 2. Parse query intent: "termurah" = sort by price asc, "termahal" = desc, etc.
 * 3. Filter by game name, product name, tag, description
 * 4. Return ranked results
 */

import { NextRequest, NextResponse } from "next/server";

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

/** Parse query intent */
function parseIntent(q: string): { sort: "asc" | "desc" | "none"; gameFilter?: string; keywords: string[] } {
  const lower = q.toLowerCase();
  let sort: "asc" | "desc" | "none" = "none";

  if (/\b(termurah|murah|cheap|cheapest|paling murah|termurah)\b/i.test(lower)) sort = "asc";
  if (/\b(termahal|mahal|expensive|priciest|paling mahal)\b/i.test(lower)) sort = "desc";

  // Extract game name
  const gameMap: Record<string, string> = {
    "blox": "blox-fruits",
    "blox fruits": "blox-fruits",
    "expedition": "expedition-antarctica",
    "antarctica": "expedition-antarctica",
    "retail": "retail-tycoon-2",
    "tycoon": "retail-tycoon-2",
  };
  let gameFilter: string | undefined;
  for (const [key, slug] of Object.entries(gameMap)) {
    if (lower.includes(key)) { gameFilter = slug; break; }
  }

  // Extract keywords (remove intent words)
  const intentWords = ["termurah", "termahal", "murah", "mahal", "paling", "joki", "cheap", "expensive", "best", "untuk", "rekomendasi", "populer", "hot"];
  const keywords = lower.split(/\s+/).filter(w => w.length > 2 && !intentWords.includes(w));

  return { sort, gameFilter, keywords };
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
    const intent = parseIntent(q);
    let results = [...items];

    // Filter by game
    if (intent.gameFilter) {
      results = results.filter(it => it.gameSlug === intent.gameFilter);
    }

    // Filter by keywords
    if (intent.keywords.length > 0) {
      results = results.filter(it => {
        const haystack = `${it.productName} ${it.gameName} ${it.description || ""} ${it.tag || ""} ${it.category}`.toLowerCase();
        return intent.keywords.some(kw => haystack.includes(kw));
      });
    }

    // If no results from keyword filter, do broader match
    if (results.length === 0) {
      const ql = q.toLowerCase();
      results = items.filter(it =>
        it.productName.toLowerCase().includes(ql) ||
        it.gameName.toLowerCase().includes(ql) ||
        (it.description || "").toLowerCase().includes(ql) ||
        (it.tag || "").toLowerCase().includes(ql)
      );
    }

    // Sort
    if (intent.sort === "asc") {
      results.sort((a, b) => a.price - b.price);
    } else if (intent.sort === "desc") {
      results.sort((a, b) => b.price - a.price);
    }

    // Limit to 5
    results = results.slice(0, 5);

    return NextResponse.json({
      ok: true,
      query: q,
      results,
      count: results.length,
      source: "smart-search",
      intent: intent.sort !== "none" ? `sorted ${intent.sort}` : "relevance",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
