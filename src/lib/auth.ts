/**
 * AKUMA JOKI — Admin Auth (Opsi B: SHA-256 hash, pure frontend)
 *
 * Login: username "dearlyfebriano", password "dearlyfebriano08"
 * Password disimpan sebagai SHA-256 hash (tidak plain text di source code).
 * Session disimpan di localStorage (persistent) dengan expiry 1 MINGGU.
 * User tidak perlu login lagi selama 7 hari setelah login terakhir.
 */

const ADMIN_USERNAME = "dearlyfebriano";
const ADMIN_PASSWORD_HASH =
  "ac423384f9343a42e14883525de7882c49d0be0d50c17c2a077fb2853ccb5c4b";
const SESSION_KEY = "akuma-admin-session";

/** Session expiry: 7 hari (1 minggu) */
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export type AdminSession = {
  user: string;
  loginAt: number;
  /** Timestamp expiry — setara loginAt + 7 hari. */
  expiresAt: number;
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
  const now = Date.now();
  const session: AdminSession = {
    user: username,
    loginAt: now,
    expiresAt: now + SESSION_MAX_AGE,
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  return true;
}

/** Logout: hapus session dari localStorage. */
export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Cek apakah user sudah login & session masih valid (belum expired).
 * Session expiry: 1 minggu setelah login terakhir.
 */
export function isAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.user || !session.loginAt || !session.expiresAt) return false;
    // cek expiry
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
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
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    // cek expiry juga di sini
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Perpanjang session (refresh expiry) jika user masih aktif.
 * Dipanggil saat admin berinteraksi dengan dashboard.
 */
export function refreshSession(): void {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw) as AdminSession;
    const now = Date.now();
    if (now > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    // perpanjang expiry 7 hari dari sekarang
    const updated: AdminSession = {
      ...session,
      expiresAt: now + SESSION_MAX_AGE,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}
