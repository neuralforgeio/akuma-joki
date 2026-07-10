import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Static import — bundled at build, hot-reloaded in dev when config.json changes.
// NOTE: imported as `takedownConfig` to avoid clashing with `export const config` (matcher).
import takedownConfig from "../config.json";

type TakedownConfig = {
  isTakedown: boolean;
  takedownReason: string;
};

const cfg = takedownConfig as TakedownConfig;

// Daftar User-Agent pattern bot scanner yang umum dipakai untuk deteksi route.
const BOT_SCANNER_PATTERNS = [
  "nikto",
  "sqlmap",
  "nmap",
  "masscan",
  "dirb",
  "dirbuster",
  "gobuster",
  "wfuzz",
  "ffuf",
  "crawler",
  "scraper",
  "scan",
  "vuln",
  "exploit",
  "hack",
  "pentest",
  "burp",
  "owasp",
  "acunetix",
  "nessus",
  "qualys",
  "nuclei",
  "httpx",
  "subfinder",
  "amass",
];

function isBotScanner(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_SCANNER_PATTERNS.some((p) => lower.includes(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get("user-agent") || "";

  // === SECURITY: block bot scanners dari akses /admin ===
  if (pathname.startsWith("/admin") && isBotScanner(ua)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // === SECURITY: block akses /admin dari referer suspicious ===
  // (mencegah link injection dari site lain)
  if (pathname.startsWith("/admin")) {
    const referer = request.headers.get("referer") || "";
    const host = request.headers.get("host") || "";
    // jika ada referer dan bukan dari host sendiri, tolak
    if (referer && !referer.includes(host) && !referer.includes("localhost")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Cek takedown dari cookie (set by dashboard admin) — per-browser
  const cookieTakedown = request.cookies.get("akuma-takedown")?.value === "1";
  const isTakedown = cfg.isTakedown || cookieTakedown;

  // When site is live, never expose the takedown page directly — bounce to home.
  if (!isTakedown && pathname === "/takedown") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // When takedown is ON, force every route to /takedown (except the takedown page itself & admin).
  if (isTakedown && pathname !== "/takedown" && !pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/takedown";
    return NextResponse.redirect(url, 307);
  }

  // === PERFORMANCE: add caching & security headers untuk static & public routes ===
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Cache static assets aggressively (helps handle traffic spike / DDOS-like load)
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  }

  // Rate-limit hint via headers (actual rate limiting done at CDN/Vercel edge)
  if (pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}

export const config = {
  // Run on everything except static assets, Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|akuma-logo.png|config.json|robots.txt).*)",
  ],
};
