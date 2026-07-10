import type { Metadata } from "next";
import { Geist, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import WhatsAppWidget from "@/components/akuma/whatsapp-widget-loader";
import { AnnouncementBanner } from "@/components/admin/announcement-banner";
import { VisitorTracker } from "@/components/admin/visitor-tracker";
import { CookieConsent } from "@/components/akuma/cookie-consent";

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
        <AnnouncementBanner />
        <VisitorTracker />
        {children}
        <WhatsAppWidget />
        <CookieConsent />
        <Toaster />
      </body>
    </html>
  );
}
