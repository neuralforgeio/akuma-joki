"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { Activity, CheckCircle, XCircle, RefreshCw } from "lucide-react";

type RouteStatus = {
  path: string;
  status: "checking" | "ok" | "error";
  time?: number;
};

const ROUTES = ["/", "/store/blox-fruits", "/store/expedition-antarctica", "/store/retail-tycoon-2", "/checkout"];

export default function PemantauanPage() {
  const games = useAdminStore((s) => s.games);
  const announcement = useAdminStore((s) => s.announcement);
  const takedown = useAdminStore((s) => s.takedown);
  const [routes, setRoutes] = useState<RouteStatus[]>(
    ROUTES.map((r) => ({ path: r, status: "checking" as const }))
  );
  const [checking, setChecking] = useState(false);

  const checkRoutes = async () => {
    setChecking(true);
    const results: RouteStatus[] = [];
    for (const path of ROUTES) {
      try {
        const start = performance.now();
        const res = await fetch(path, { method: "HEAD" });
        const time = Math.round(performance.now() - start);
        results.push({
          path,
          status: res.ok ? "ok" : "error",
          time,
        });
      } catch {
        results.push({ path, status: "error" });
      }
    }
    setRoutes(results);
    setChecking(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkRoutes();
  }, []);

  const okCount = routes.filter((r) => r.status === "ok").length;
  const errCount = routes.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-base sm:text-lg text-[#e5e5e5] text-glow-neon">
            PEMANTAUAN WEBSITE
          </h1>
          <p className="mt-1 text-sm text-[#9a93a8]">
            Status real-time route & sistem.
          </p>
        </div>
        <button
          onClick={checkRoutes}
          disabled={checking}
          className="flex items-center gap-2 font-pixel text-[8px] uppercase text-[#c44bff] border-2 border-[#a020f0]/40 px-3 py-2 pixel-corner hover:bg-[#a020f0]/10 disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${checking ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border-2 border-[#6ee7b7]/40 bg-[#6ee7b7]/5 pixel-corner p-4 text-center">
          <CheckCircle className="mx-auto size-5 text-[#6ee7b7]" />
          <p className="mt-2 font-pixel text-xl text-[#6ee7b7]">{okCount}</p>
          <p className="font-pixel text-[7px] uppercase text-[#9a93a8]">OK</p>
        </div>
        <div className="border-2 border-[#ff3b6b]/40 bg-[#ff3b6b]/5 pixel-corner p-4 text-center">
          <XCircle className="mx-auto size-5 text-[#ff3b6b]" />
          <p className="mt-2 font-pixel text-xl text-[#ff3b6b]">{errCount}</p>
          <p className="font-pixel text-[7px] uppercase text-[#9a93a8]">Error</p>
        </div>
        <div className="border-2 border-[#7fd4ff]/40 bg-[#7fd4ff]/5 pixel-corner p-4 text-center">
          <Activity className="mx-auto size-5 text-[#7fd4ff]" />
          <p className="mt-2 font-pixel text-xl text-[#7fd4ff]">{routes.length}</p>
          <p className="font-pixel text-[7px] uppercase text-[#9a93a8]">Total Route</p>
        </div>
      </div>

      {/* route table */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner overflow-hidden">
        <div className="border-b-2 border-[#2a2436] bg-[#0a0a0a] px-4 py-3">
          <h2 className="font-pixel text-[9px] uppercase text-[#c44bff]">Route Health</h2>
        </div>
        <div className="divide-y divide-[#2a2436]">
          {routes.map((r) => (
            <div key={r.path} className="flex items-center gap-3 px-4 py-3">
              {r.status === "checking" && (
                <RefreshCw className="size-4 text-[#9a93a8] animate-spin" />
              )}
              {r.status === "ok" && <CheckCircle className="size-4 text-[#6ee7b7]" />}
              {r.status === "error" && <XCircle className="size-4 text-[#ff3b6b]" />}
              <span className="text-sm text-[#e5e5e5] flex-1 font-mono">{r.path}</span>
              <span
                className={`font-pixel text-[7px] uppercase px-2 py-1 pixel-corner ${
                  r.status === "ok"
                    ? "text-[#6ee7b7] bg-[#6ee7b7]/10"
                    : r.status === "error"
                    ? "text-[#ff3b6b] bg-[#ff3b6b]/10"
                    : "text-[#9a93a8] bg-[#2a2436]"
                }`}
              >
                {r.status === "checking" ? "CHECKING" : r.status === "ok" ? "OK" : "ERROR"}
              </span>
              {r.time && (
                <span className="font-pixel text-[7px] text-[#9a93a8]">{r.time}ms</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* system info */}
      <div className="border-2 border-[#2a2436] bg-[#121017] pixel-corner p-5">
        <h2 className="mb-4 font-pixel text-[9px] uppercase text-[#c44bff]">System Info</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Total Games" value={String(games.length)} />
          <InfoRow label="Announcement" value={announcement?.active ? "Active" : "Off"} />
          <InfoRow label="Takedown Mode" value={takedown ? "ON" : "OFF"} />
          <InfoRow label="Browser" value={typeof navigator !== "undefined" ? navigator.userAgent.split(") ")[0].split("(").pop() || "Unknown" : "SSR"} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#2a2436] py-2">
      <span className="font-pixel text-[7px] uppercase text-[#9a93a8]">{label}</span>
      <span className="text-sm text-[#e5e5e5]">{value}</span>
    </div>
  );
}
