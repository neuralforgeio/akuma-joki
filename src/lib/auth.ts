/**
 * AKUMA JOKI — Admin Auth (Multi-role: developer + admin)
 *
 * Roles:
 * - developer: dearlyfebriano / dearlyfebriano08 (full access, all features)
 * - admin: nelsoncihuy67 / yahjokssmplagi (limited access, no commit/pemantauan)
 *
 * Password disimpan sebagai SHA-256 hash. Session di localStorage (7 hari).
 */

type Role = "developer" | "admin";

type User = {
  username: string;
  passwordHash: string;
  role: Role;
};

const USERS: User[] = [
  {
    username: "dearlyfebriano",
    passwordHash: "ac423384f9343a42e14883525de7882c49d0be0d50c17c2a077fb2853ccb5c4b",
    role: "developer",
  },
  {
    username: "nelsoncihuy67",
    passwordHash: "9329ba5c2505c0b30606e14332bbe713c487a483935e1c4e9321a47973b0ab94",
    role: "admin",
  },
];

const SESSION_KEY = "akuma-admin-session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export type AdminSession = {
  user: string;
  role: Role;
  loginAt: number;
  expiresAt: number;
};

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function login(
  username: string,
  password: string
): Promise<boolean> {
  const user = USERS.find((u) => u.username === username);
  if (!user) return false;
  const hash = await sha256(password);
  if (hash !== user.passwordHash) return false;
  const now = Date.now();
  const session: AdminSession = {
    user: username,
    role: user.role,
    loginAt: now,
    expiresAt: now + SESSION_MAX_AGE,
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
  return true;
}

export function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

export function isAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.user || !session.role || !session.loginAt || !session.expiresAt) return false;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch { return false; }
}

export function getSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

export function getRole(): Role | null {
  const session = getSession();
  return session?.role ?? null;
}

export function isDeveloper(): boolean {
  return getRole() === "developer";
}

export function isAdmin(): boolean {
  return getRole() === "admin";
}

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
    const updated: AdminSession = { ...session, expiresAt: now + SESSION_MAX_AGE };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}
