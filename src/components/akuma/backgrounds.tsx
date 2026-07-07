import { cn } from "@/lib/utils";

/**
 * Pure-CSS animated starfield — uses translate3d for GPU acceleration.
 * Pointer-events none, fixed behind content. Anti-lag for low-end devices.
 */
export function Starfield({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {/* Three layered star tracks at different speeds/directions for parallax */}
      <div className="akuma-stars__layer akuma-stars__layer--1" />
      <div className="akuma-stars__layer akuma-stars__layer--2" />
      <div className="akuma-stars__layer akuma-stars__layer--3" />
    </div>
  );
}

/**
 * Moving neon grid background — pure CSS, translate3d based, GPU handled.
 */
export function MovingGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div className="akuma-moving-grid" />
    </div>
  );
}
