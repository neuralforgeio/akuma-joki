"use client";

import { useEffect, useState } from "react";

/**
 * DeferredLoader — render children hanya setelah delay (default 2s) ATAU
 * setelah user interact (scroll/click/keydown). Tujuan: defer non-critical
 * floating components (social proof, cookie consent, back-to-top) agar
 * tidak block first paint & interactivity.
 *
 * Komponen kritis (Navbar, konten utama) render langsung.
 * Komponen non-kritis (floating overlays) render deferred.
 */
export function DeferredLoader({
  children,
  delay = 2000,
  fallback = null,
}: {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let triggered = false;

    const trigger = () => {
      if (triggered) return;
      triggered = true;
      setShouldRender(true);
      cleanup();
    };

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", trigger, { passive: true } as EventListenerOptions);
      window.removeEventListener("click", trigger);
      window.removeEventListener("keydown", trigger);
      window.removeEventListener("touchstart", trigger, { passive: true } as EventListenerOptions);
    };

    // Render setelah delay (fallback jika user tidak interact)
    timer = setTimeout(trigger, delay);

    // Atau render saat user pertama kali interact (lebih cepat dirasakan)
    window.addEventListener("scroll", trigger, { passive: true });
    window.addEventListener("click", trigger);
    window.addEventListener("keydown", trigger);
    window.addEventListener("touchstart", trigger, { passive: true });

    return cleanup;
  }, [delay]);

  if (!shouldRender) return <>{fallback}</>;
  return <>{children}</>;
}
