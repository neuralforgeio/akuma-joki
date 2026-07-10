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

// Daftar User-Agent pattern bot scanner yang SPESIFIK (hindari kata umum
// seperti "scan"/"crawler"/"scraper" yang bisa match preview panel / browser legit).
const BOT_SCANNER_PATTERNS = [
  "nikto",
  "sqlmap",
  "nmap",
  "masscan",
  "dirbuster",
  "gobuster",
  "wfuzz",
  "ffuf",
  "vuln",
  "exploit",
  "pentest",
  "burp",
  "owasp",
  "acunetix",
  "nessus",
  "qualys",
  "nuclei",
  "subfinder",
  "amass",
  "hydra",
  "metasploit",
  "w3af",
  "skipfish",
  "ratproxy",
];

// Domain Z.ai platform yang WAJIB di-whitelist (preview panel, dev env, dll).
const ZAI_WHITELIST_DOMAINS = [
  "space-z.ai",
  "chatglm.cn",
  "chat.z.ai",
  "z.ai",
  "localhost",
  "127.0.0.1",
  "vercel.app",
  "now.sh",
];

function isBotScanner(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_SCANNER_PATTERNS.some((p) => lower.includes(p));
}

function isWhitelistedReferer(referer: string, host: string): boolean {
  if (!referer) return true; // no referer = allow
  // allow jika referer dari host sendiri
  if (referer.includes(host)) return true;
  // allow jika referer dari domain whitelist Z.ai
  return ZAI_WHITELIST_DOMAINS.some((d) => referer.includes(d));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get("user-agent") || "";
  const host = request.headers.get("host") || "";
  const referer = request.headers.get("referer") || "";

  // === SECURITY: block bot scanners dari akses /admin (hanya /admin, bukan semua route) ===
  // Whitelist: Z.ai preview panel UA (bisa mengandung "preview"/"z.ai"/"chatglm")
  // Jangan whitelist berdasar host (localhost dev harus tetap di-test untuk bot block).
  const isZaiPreviewUA =
    ua.toLowerCase().includes("z.ai") ||
    ua.toLowerCase().includes("chatglm") ||
    ua.toLowerCase().includes("preview");
  // Browser legit (Mozilla/Chrome/Firefox/Safari) TIDAK di-block meski UA mengandung
  // kata umum seperti "scan" (mis. "Mozilla ... AppleWebKit ... scan viewer").
  const isRealBrowser =
    ua.includes("Mozilla") ||
    ua.includes("Chrome") ||
    ua.includes("Firefox") ||
    ua.includes("Safari") ||
    ua.includes("Edge");

  if (
    pathname.startsWith("/admin") &&
    isBotScanner(ua) &&
    !isZaiPreviewUA &&
    !isRealBrowser
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // === SECURITY: block akses /admin dari referer suspicious ===
  // (mencegah link injection dari site lain) — whitelist Z.ai domain
  if (pathname.startsWith("/admin") && !isWhitelistedReferer(referer, host)) {
    return new NextResponse("Forbidden", { status: 403 });
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

  // === PERFORMANCE: add caching & security headers ===
  const response = NextResponse.next();

  // Security headers — admin & public routes sama-sama allow iframe dari Z.ai preview.
  // X-Frame-Options & CSP frame-ancestors sudah di-handle di next.config.ts headers().
  // Middleware hanya set no-cache untuk admin (prevent sensitive page caching).
  if (pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

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

  return response;
}

export const config = {
  // Run on everything except static assets, Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|akuma-logo.png|config.json|robots.txt).*)",
  ],
};
