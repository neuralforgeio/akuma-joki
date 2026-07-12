/**
 * AKUMA JOKI — Reviews (cross-device via GitHub sync)
 *
 * SEBELUMNYA: pakai localStorage (`akuma-reviews`) — tidak sync cross-device.
 * SEKARANG: delegate ke admin-store (single source of truth).
 *   - State reviews berasal dari admin-data.json (di-build via Vercel)
 *   - addReview/deleteReview → admin store → triggerSync → GitHub → redeploy
 *
 * Hook ini tetap expose interface yang sama (useReviews) supaya komponen
 * yang sudah pakai (store-view, home-view) tidak perlu diubah banyak.
 */

import { useAdminStore } from "./admin-store";
import type { Review } from "./games-data";

type ReviewsState = {
  reviews: Review[];
  _hasHydrated: boolean;
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
  deleteReview: (id: string) => void;
  getReviewsByGame: (gameSlug: string) => Review[];
  getAverageRating: (gameSlug: string) => number;
  setHasHydrated: (v: boolean) => void;
};

/** Cleanup localStorage lama (migrasi sekali di module load). */
if (typeof window !== "undefined") {
  try {
    if (localStorage.getItem("akuma-reviews")) {
      localStorage.removeItem("akuma-reviews");
    }
  } catch {
    /* ignore */
  }
}

/**
 * Wrapper hook — delegate selector ke admin store.
 * Komponen pakai: `useReviews((s) => s.reviews)`, `useReviews((s) => s.addReview)`, dll.
 *
 * AdminState punya field yang sama (reviews, addReview, deleteReview,
 * _hasHydrated, setHasHydrated), jadi selector langsung jalan tanpa
 * intermediate object (no re-render issue).
 */
export function useReviews<T>(selector: (s: ReviewsState) => T): T {
  return useAdminStore(selector as (s: any) => T);
}

/** Re-export Review type for convenience. */
export type { Review };
