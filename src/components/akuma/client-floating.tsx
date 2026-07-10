"use client";

import dynamic from "next/dynamic";
import { DeferredLoader } from "@/components/akuma/deferred-loader";

// Lazy load heavy floating components (reduce initial JS bundle)
// ssr: false karena tidak perlu SSR (floating UI, muncul setelah interact)
const WhatsAppWidget = dynamic(
  () => import("@/components/akuma/whatsapp-widget-loader"),
  { ssr: false, loading: () => null }
);
const CookieConsent = dynamic(
  () => import("@/components/akuma/cookie-consent").then((m) => ({ default: m.CookieConsent })),
  { ssr: false, loading: () => null }
);

/**
 * ClientWrapper — wrapper untuk floating components yang butuh lazy load.
 * Dipakai di root layout (server component) agar dynamic import ssr:false works.
 */
export function ClientFloatingComponents() {
  return (
    <DeferredLoader delay={3000}>
      <WhatsAppWidget />
      <CookieConsent />
    </DeferredLoader>
  );
}
