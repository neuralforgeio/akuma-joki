"use client";

/**
 * Lazy loader for WhatsAppWidget.
 * Widget di-import dengan ssr:false agar tidak membebani initial paint
 * (Framer Motion + logic hanya di-load setelah hydration di sisi klien).
 */
import dynamic from "next/dynamic";

const WhatsAppWidget = dynamic(
  () => import("./whatsapp-widget").then((m) => m.WhatsAppWidget),
  {
    ssr: false,
    loading: () => null,
  }
);

export default WhatsAppWidget;
