"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * LanguageHydrationGate — triggers manual rehydration of the i18n zustand persist store
 * AFTER the first client render. This avoids hydration mismatch warnings because:
 *   - SSR renders with default lang="id"
 *   - Client first render also uses lang="id" (since skipHydration=true on the persist)
 *   - After mount, this component calls useI18n.persist.rehydrate() which loads the
 *     persisted language from localStorage and triggers re-render with the user's choice.
 *
 * Mount ONCE near the root layout.
 */
export function LanguageHydrationGate() {
  useEffect(() => {
    // Rehydrate the persisted language after mount to avoid SSR/client mismatch.
    useI18n.persist.rehydrate();
  }, []);

  return null;
}
