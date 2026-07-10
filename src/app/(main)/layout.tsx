"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/akuma/navbar";
import { Footer } from "@/components/akuma/footer";
import { BackToTop } from "@/components/akuma/back-to-top";

/**
 * Wraps all "normal" routes (/, /store/*, /checkout) with the Navbar + Footer
 * and a lightweight Framer Motion mount/unmount transition keyed by pathname.
 * The /takedown route lives OUTSIDE this group, so it has no chrome.
 *
 * Framer Motion is intentionally used ONLY here (page mount/unmount) per the
 * anti-lag requirement. All other animations (backgrounds, scroll reveals,
 * card hovers) are pure CSS / GPU transforms.
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
      <BackToTop />
    </div>
  );
}
