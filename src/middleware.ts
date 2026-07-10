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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // When site is live, never expose the takedown page directly — bounce to home.
  if (!cfg.isTakedown && pathname === "/takedown") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // When takedown is ON, force every route to /takedown (except the takedown page itself).
  if (cfg.isTakedown && pathname !== "/takedown") {
    const url = request.nextUrl.clone();
    url.pathname = "/takedown";
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets, Next internals, and downloadable files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|akuma-logo.png|config.json|robots.txt).*)",
  ],
};
