"use client";

import { AkumaError } from "@/components/akuma/akuma-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <AkumaError
          code="500"
          title="Fatal Error"
          description="Terjadi error kritis. Silakan reload halaman atau kembali ke beranda."
          showRefresh
        />
      </body>
    </html>
  );
}
