"use client";

import { AkumaError } from "@/components/akuma/akuma-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AkumaError
      code="500"
      title="Terjadi Kesalahan Server"
      description="Maaf, terjadi error di sisi server. Tim kami sudah diberi notifikasi. Coba reload halaman ini."
      showRefresh
    />
  );
}
