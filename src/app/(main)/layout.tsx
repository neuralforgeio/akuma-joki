"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/akuma/navbar";
import { Footer } from "@/components/akuma/footer";
import { DeferredLoader } from "@/components/akuma/deferred-loader";

// Lazy load non-critical floating components (reduce initial JS bundle)
const BackToTop = dynamic(() => import("@/components/akuma/back-to-top").then(m => ({ default: m.BackToTop })), {
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
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
      </DeferredLoader>
    </div>
  );
}
