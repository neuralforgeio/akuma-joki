"use client";

/**
 * SkeletonCard — placeholder loading card dengan animasi pulse.
 * Dipakai saat data masih loading (avoid flash of empty content).
 * Tema pixel-art Akuma (dark bg, pixel-corner, purple accent).
 */
export function SkeletonCard() {
  return (
    <div className="h-full border-2 border-[#2a2436] bg-[#121017] pixel-corner overflow-hidden animate-pulse">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#2a2436] bg-[#0a0a0a]/60">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 bg-[#2a2436]" />
          <div className="h-2 w-10 bg-[#2a2436]" />
        </div>
        <div className="h-4 w-16 bg-[#2a2436]" />
      </div>
      {/* body */}
      <div className="px-4 py-5 space-y-3">
        <div className="h-3 w-3/4 bg-[#2a2436]" />
        <div className="h-2 w-full bg-[#2a2436]" />
        <div className="h-2 w-2/3 bg-[#2a2436]" />
        <div className="h-6 w-20 bg-[#2a2436] mt-4" />
      </div>
      {/* action */}
      <div className="px-4 pb-4">
        <div className="h-10 w-full bg-[#2a2436] pixel-corner" />
      </div>
    </div>
  );
}

/**
 * SkeletonGrid — grid dari SkeletonCard untuk loading state.
 * Count = jumlah card placeholder.
 */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonGameCard — placeholder untuk game card di homepage.
 */
export function SkeletonGameCard() {
  return (
    <div className="h-full border-2 border-[#2a2436] bg-[#121017] pixel-corner overflow-hidden animate-pulse">
      <div className="flex h-20 items-center justify-center border-b-2 border-[#2a2436] bg-[#0a0a0a]/60">
        <div className="h-12 w-12 bg-[#2a2436]" />
      </div>
      <div className="p-5 space-y-3">
        <div className="h-3 w-1/2 bg-[#2a2436]" />
        <div className="h-2 w-full bg-[#2a2436]" />
        <div className="h-2 w-3/4 bg-[#2a2436]" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 w-16 bg-[#2a2436]" />
          <div className="h-5 w-16 bg-[#2a2436]" />
        </div>
        <div className="h-10 w-full bg-[#2a2436] pixel-corner mt-4" />
      </div>
    </div>
  );
}
