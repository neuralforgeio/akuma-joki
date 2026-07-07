"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the reveal kicks in (after entering viewport). */
  delay?: number;
  /** Render as a different element (default: div). */
  as?: ElementType;
};

/**
 * Lightweight scroll-reveal using IntersectionObserver + CSS transform/opacity.
 * No Framer Motion — GPU-friendly (transform/opacity only), anti-lag.
 * Falls back to visible if IntersectionObserver is unavailable.
 */
export function Reveal({ children, className, delay = 0, as }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If IntersectionObserver is unavailable, reveal after a microtask so we
    // don't call setState synchronously inside the effect body.
    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setShown(true), 0);
      return () => window.clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            window.setTimeout(() => setShown(true), delay);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "-40px 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref as never} className={cn("akuma-reveal", shown && "akuma-reveal--in", className)}>
      {children}
    </Tag>
  );
}
