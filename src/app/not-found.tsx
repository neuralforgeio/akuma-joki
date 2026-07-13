import { AkumaError } from "@/components/akuma/akuma-error";

export default function NotFound() {
  return (
    <AkumaError
      code="404"
      title="Halaman Tidak Ditemukan"
      description="Halaman yang kamu cari tidak ada atau sudah dipindahkan. Coba kembali ke beranda atau jelajahi store kami."
    />
  );
}
