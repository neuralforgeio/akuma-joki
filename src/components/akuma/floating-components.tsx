"use client";

import dynamic from "next/dynamic";

/**
 * FloatingComponents — all non-critical floating UI, lazy-loaded.
 * Separated from MainLayout so MainLayout can be a Server Component.
 */
const BackToTop = dynamic(() => import("@/components/akuma/back-to-top").then(m => ({ default: m.BackToTop })), { ssr: false, loading: () => null });
const KeyboardShortcutsHint = dynamic(() => import("@/components/akuma/keyboard-shortcuts").then(m => ({ default: m.KeyboardShortcutsHint })), { ssr: false, loading: () => null });
const PushNotificationOptIn = dynamic(() => import("@/components/akuma/push-notif-opt-in").then(m => ({ default: m.PushNotificationOptIn })), { ssr: false, loading: () => null });
const PWAInstaller = dynamic(() => import("@/components/akuma/pwa-installer").then(m => ({ default: m.PWAInstaller })), { ssr: false, loading: () => null });
const AchievementToast = dynamic(() => import("@/components/akuma/achievement-toast").then(m => ({ default: m.AchievementToast })), { ssr: false, loading: () => null });
const PriceCalculator = dynamic(() => import("@/components/akuma/price-calculator").then(m => ({ default: m.PriceCalculator })), { ssr: false, loading: () => null });

export function FloatingComponents() {
  return (
    <>
      <BackToTop />
      <KeyboardShortcutsHint />
      <PushNotificationOptIn />
      <PWAInstaller />
      <AchievementToast />
      <PriceCalculator />
    </>
  );
}
