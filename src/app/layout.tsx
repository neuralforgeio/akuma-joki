import type { Metadata } from "next";
import { Geist, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AnnouncementBanner } from "@/components/admin/announcement-banner";
import { VisitorTracker } from "@/components/admin/visitor-tracker";
import { NetworkStatus } from "@/components/akuma/network-status";
import { ClientFloatingComponents } from "@/components/akuma/client-floating";

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
  description:
    "AKUMA JOKI: Joki & Store Roblox untuk Blox Fruits, Expedition Antarctica, dan Retail Tycoon 2. Aman, cepat, harga bersahabat.",
  keywords: [
    "AKUMA JOKI",
    "Joki Roblox",
    "Blox Fruits Joki",
    "Expedition Antarctica",
    "Retail Tycoon 2",
    "Joki Murah",
  ],
  authors: [{ name: "AKUMA JOKI" }],
  icons: {
    icon: "/akuma-logo.png",
    apple: "/akuma-logo.png",
  },
  manifest: "/manifest.json",
  themeColor: "#a020f0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AKUMA JOKI",
  },
  openGraph: {
    title: "AKUMA JOKI — Joki & Store Roblox",
    description: "Joki Roblox aman, cepat, harga bersahabat.",
    siteName: "AKUMA JOKI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${pixelFont.variable} font-sans antialiased bg-background text-foreground`}
      >
        <NetworkStatus />
        <AnnouncementBanner />
        <VisitorTracker />
        {children}
        {/* Non-critical floating components: deferred load (3s atau user interact) */}
        <ClientFloatingComponents />
        <Toaster />
      </body>
    </html>
  );
}
