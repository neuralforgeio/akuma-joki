import { Navbar } from "@/components/akuma/navbar";
import { Footer } from "@/components/akuma/footer";
import { AutoSyncClient } from "@/components/akuma/auto-sync-client";
import { FloatingComponents } from "@/components/akuma/floating-components";

/**
 * MainLayout — Server Component (no "use client")
 * Wraps all normal routes with Navbar + Footer.
 * Client logic (useAutoSync, AnimatePresence) moved to separate client components.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a0a0a]">
      <Navbar />
      <AutoSyncClient />
      <main className="relative flex-1">
        {children}
      </main>
      <Footer />
      <FloatingComponents />
    </div>
  );
}
