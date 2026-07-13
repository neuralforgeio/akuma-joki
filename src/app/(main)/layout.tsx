"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/akuma/navbar";
import { Footer } from "@/components/akuma/footer";
import { DeferredLoader } from "@/components/akuma/deferred-loader";
import { useAutoSync } from "@/lib/use-auto-sync";

// Lazy load non-critical floating components (reduce initial JS bundle)
const BackToTop = dynamic(() => import("@/components/akuma/back-to-top").then(m => ({ default: m.BackToTop })), {
  ssr: false,
  loading: () => null,
});
const KeyboardShortcutsHint = dynamic(() => import("@/components/akuma/keyboard-shortcuts").then(m => ({ default: m.KeyboardShortcutsHint })), {
  ssr: false,
  loading: () => null,
});
const PushNotificationOptIn = dynamic(() => import("@/components/akuma/push-notif-opt-in").then(m => ({ default: m.PushNotificationOptIn })), {
  ssr: false,
  loading: () => null,
});
const PWAInstaller = dynamic(() => import("@/components/akuma/pwa-installer").then(m => ({ default: m.PWAInstaller })), {
  ssr: false,
  loading: () => null,
});
const SocialProof = dynamic(() => import("@/components/akuma/social-proof").then(m => ({ default: m.SocialProof })), {
  ssr: false,
  loading: () => null,
});
const AchievementToast = dynamic(() => import("@/components/akuma/achievement-toast").then(m => ({ default: m.AchievementToast })), {
  ssr: false,
  loading: () => null,
});
const PriceCalculator = dynamic(() => import("@/components/akuma/price-calculator").then(m => ({ default: m.PriceCalculator })), {
  ssr: false,
  loading: () => null,
});

/**
 * Wraps all "normal" routes (/, /store/*, /checkout) with the Navbar + Footer
 * and a lightweight Framer Motion mount/unmount transition keyed by pathname.
 * The /takedown route lives OUTSIDE this group, so it has no chrome.
 *
 * Performance: BackToTop & SocialProof lazy-loaded + deferred (render setelah
 * user interact atau 2s delay). Navbar & Footer render langsung (critical).
 *
 * useAutoSync: polling data dari GitHub raw setiap 60 detik untuk
 * cross-device sync (games, reviews, about, dll).
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useAutoSync();

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a0a0a]">
      <Navbar />
      <main className="relative flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      {/* Non-critical floating components: deferred load (2s atau user interact) */}
      <DeferredLoader delay={2000}>
        <BackToTop />
        <KeyboardShortcutsHint />
        <PushNotificationOptIn />
        <PWAInstaller />
        <SocialProof />
        <AchievementToast />
        <PriceCalculator />
      </DeferredLoader>
    </div>
  );
}
