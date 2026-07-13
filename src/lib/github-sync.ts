/**
 * Client-side helper untuk sync admin data ke GitHub via API route.
 * Dipanggil oleh admin store setiap kali ada perubahan data.
 */

type SyncPayload = {
  games: unknown[];
  announcement: unknown;
  takedown: boolean;
  takedownReason: string;
  settings: { whatsappNumber: string; csName: string };
  faq: unknown[];
  waReplies: unknown[];
  version: number;
  updatedAt: string;
};

type SyncResult = {
  success: boolean;
  commit?: { sha: string; message: string; url: string };
  note?: string;
  error?: string;
};

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

/**
 * Sync data ke GitHub. Debounced 2 detik agar tidak spam API
 * jika admin cepat-cepat melakukan multiple changes.
 */
export function scheduleGitHubSync(
  data: SyncPayload,
  commitMessage?: string
): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void syncToGitHub(data, commitMessage);
  }, 2000);
}

/**
 * Eksekusi sync ke API route /api/sync-github.
 */
export async function syncToGitHub(
  data: SyncPayload,
  commitMessage?: string
): Promise<SyncResult> {
  if (isSyncing) return { success: false, error: "Sync in progress" };
  isSyncing = true;

  try {
    const res = await fetch("/api/sync-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, commitMessage }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown" }));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const result = await res.json();
    return {
      success: true,
      commit: result.commit,
      note: result.note,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { success: false, error: msg };
  } finally {
    isSyncing = false;
  }
}
