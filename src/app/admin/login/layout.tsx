/**
 * Layout untuk /admin/login — TANPA sidebar & guard (halaman publik).
 * Override parent admin layout.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
