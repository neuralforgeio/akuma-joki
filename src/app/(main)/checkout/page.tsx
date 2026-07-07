import type { Metadata } from "next";
import { CheckoutView } from "@/components/akuma/checkout-view";

export const metadata: Metadata = {
  title: "Checkout — AKUMA JOKI",
  description: "Selesaikan order joki Roblox-mu via WhatsApp.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
