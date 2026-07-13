"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { DeferredLoader } from "@/components/akuma/deferred-loader";

const WhatsAppWidget = dynamic(
  () => import("@/components/akuma/whatsapp-widget-loader"),
  { ssr: false, loading: () => null }
);
const CookieConsent = dynamic(
  () => import("@/components/akuma/cookie-consent").then((m) => ({ default: m.CookieConsent })),
  { ssr: false, loading: () => null }
);

/**
 * ClientFloatingComponents — floating components yang hanya muncul di halaman tertentu.
 * - WhatsApp Widget: HANYA di halaman public (/, /store/*, /checkout)
 *   TIDAK muncul di /admin/*, /takedown, /login
 * - Cookie Consent: semua halaman public
 */
export function ClientFloatingComponents() {
  const pathname = usePathname();

  // WA widget hanya di halaman public (tidak di admin/login/takedown)
  const showWhatsApp = pathname === "/" || pathname.startsWith("/store/") || pathname === "/checkout";

  return (
    <DeferredLoader delay={3000}>
      {showWhatsApp && <WhatsAppWidget />}
      <CookieConsent />
    </DeferredLoader>
  );
}
