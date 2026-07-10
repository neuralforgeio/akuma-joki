/**
 * AKUMA JOKI — Admin Auth (Opsi B: SHA-256 hash, pure frontend)
 *
 * Login: username "dearlyfebriano", password "dearlyfebriano08"
 * Password disimpan sebagai SHA-256 hash (tidak plain text di source code).
 * Session disimpan di sessionStorage (auto-logout saat tutup browser).
 */

const ADMIN_USERNAME = "dearlyfebriano";
const ADMIN_PASSWORD_HASH =
  "ac423384f9343a42e14883525de7882c49d0be0d50c17c2a077fb2853ccb5c4b";
const SESSION_KEY = "akuma-admin-session";

export type AdminSession = {
  user: string;
  loginAt: number;
};

/** Hash string dengan SHA-256 menggunakan Web Crypto API. */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cek login. Return true jika username+password match. */
export async function login(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  const hash = await sha256(password);
  if (hash !== ADMIN_PASSWORD_HASH) return false;
  const session: AdminSession = { user: username, loginAt: Date.now() };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  return true;
}

/** Logout: hapus session. */
export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Cek apakah user sudah login. */
export function isAuthenticated(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.user || !session.loginAt) return false;
    // session valid 24 jam
    if (Date.now() - session.loginAt > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Ambil info session. */
export function getSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}
