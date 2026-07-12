import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Reviews store — simpan rating & review dari customer (localStorage).
 * Pure frontend, no backend needed.
 */
export type Review = {
  id: string;
  gameSlug: string;
  gameName: string;
  productName: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
};

type ReviewsState = {
  reviews: Review[];
  _hasHydrated: boolean;
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
  deleteReview: (id: string) => void;
  getReviewsByGame: (gameSlug: string) => Review[];
  getAverageRating: (gameSlug: string) => number;
  setHasHydrated: (v: boolean) => void;
};

export const useReviews = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      addReview: (r) => {
        const review: Review = { ...r, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: Date.now() };
        set((s) => ({ reviews: [review, ...s.reviews] }));
        // Sync reviews to GitHub via admin store triggerSync
        try {
          import("./admin-store").then(({ useAdminStore }) => {
            const allReviews = useReviews.getState().reviews;
            useAdminStore.getState().triggerSync(`Add review: ${r.customerName} → ${r.gameName}`);
            // Also push reviews separately to data/admin-data.json
            fetch("/api/sync-github", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data: { ...useAdminStore.getState(), reviews: allReviews },
                commitMessage: `Add review: ${r.customerName} → ${r.gameName}`,
              }),
            }).catch(() => {});
          });
        } catch { /* ignore */ }
      },
      deleteReview: (id) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
      getReviewsByGame: (gameSlug) => get().reviews.filter((r) => r.gameSlug === gameSlug),
      getAverageRating: (gameSlug) => {
        const gameReviews = get().reviews.filter((r) => r.gameSlug === gameSlug);
        if (gameReviews.length === 0) return 0;
        return gameReviews.reduce((a, r) => a + r.rating, 0) / gameReviews.length;
      },
    }),
    {
      name: "akuma-reviews",
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
    }
  )
);
