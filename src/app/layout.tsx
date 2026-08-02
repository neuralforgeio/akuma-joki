import type { Metadata } from "next";
import { Geist, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AnnouncementBanner } from "@/components/admin/announcement-banner";
import { VisitorTracker } from "@/components/admin/visitor-tracker";
import { NetworkStatus } from "@/components/akuma/network-status";
import { ClientFloatingComponents } from "@/components/akuma/client-floating";
import { ConfirmModal } from "@/components/akuma/confirm-modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AKUMA JOKI — Joki & Store Roblox Terpercaya",
  description: "AKUMA JOKI: Joki & Store Roblox untuk Blox Fruits, Expedition Antarctica, dan Retail Tycoon 2.",
};

export const viewport = {
  themeColor: "#a020f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <body className={`${geistSans.variable} ${pixelFont.variable} font-sans antialiased bg-background text-foreground`}>
        <NetworkStatus />
        <AnnouncementBanner />
        <VisitorTracker />
        {children}
        <ClientFloatingComponents />
        <ConfirmModal />
        <Toaster />
      </body>
    </html>
  );
}
