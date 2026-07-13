# Task 2-3 — i18n Completion + 10 Advanced Features

**Agent:** coding-agent (Task 2-3)
**Date:** auto
**Status:** ✅ Complete

## Summary

Completed comprehensive i18n coverage across all remaining components (footer, home-view, store-view, checkout-view, admin dashboard) and implemented 10 new advanced frontend features. All features are pure frontend (no backend, no API). Build passes, lint passes (0 errors, 0 warnings).

## Task 1: Comprehensive i18n

### Files updated with i18n (6)

| # | File | What was translated |
|---|------|---------------------|
| 1 | `src/lib/i18n.ts` | Added 100+ new keys to BOTH ID and EN dictionaries (footer.*, checkout.*, store.*, common.home/item/close/copy, home.keunggulan/testimoni/pilihGame/jokiTersedia/mulai, dash.help*/announcement/takedown/commit/visitor7/noVisitorData/commitTerbaru, plus all 10 new feature namespaces). Added `skipHydration: true` + onRehydrateStorage to fix SSR/CSR hydration mismatch. |
| 2 | `src/components/akuma/footer.tsx` | All text: tagline, Games, Features (4 items), Contact, WhatsApp Admin, Track Order, copyright, poweredBy. |
| 3 | `src/components/akuma/home-view.tsx` | Remaining hardcoded: 6th feature card (Garansi Hasil), KEUNGGULAN heading, TESTIMONI heading, PILIH GAME heading, game card desc, "joki tersedia", "Mulai →". |
| 4 | `src/components/akuma/store-view.tsx` | All filter labels (search, categories, tags, sort), Reset button, no-results, item count, StoreReviews sub-component (write review, rating, send, empty, name/comment placeholders), cart limit modal (title, desc, checkout now, close), Beranda back link, Total Joki, other games section, modal Robux label, ProductCard (Joki, Dipilih, PROMO, price, Pilih Joki, Di Keranjang), navbar "Lihat semua game →", "Game Tersedia", "Pilih untuk lihat", search empty states. |
| 5 | `src/components/akuma/checkout-view.tsx` | CHECKOUT title, SELESAIKAN ORDER subtitle, Beranda back, DATA AKUN ROBLOX + desc, Username/Password labels + placeholders, agree text, ORDER VIA WHATSAPP, max order warnings, trust badges (3), Ringkasan Pesanan, Jenis Joki, Kategori, Total Harga, Total (n item), 4 step texts, success modal (title, desc, track order, close), Order ID hint + Processing status, EmptyOrder (title, desc, aman, pro cepat, garansi, CS, joki pro, pilih joki, back home, history desc, copy, delete), Terlihat/Tersembunyi, Field sub-component, OrderETAPredictor. |
| 6 | `src/app/admin/(protected)/page.tsx` | HelpBanner title/desc/tips, status badges (Takedown ON / Website Live, Announcement Active / No Announcement), quick action buttons (Announcement, Takedown, Commit), Visitor 7 Hari heading, no visitor data, Commit Terbaru heading. |

### Hydration mismatch fix (NEW)
Pre-existing hydration warning (`Lacak Order` on SSR vs `Track Order` on client) fixed by:
1. Adding `skipHydration: true` to the i18n persist middleware
2. Created `src/components/akuma/language-hydration-gate.tsx` — calls `useI18n.persist.rehydrate()` in `useEffect` after mount
3. Mounted `<LanguageHydrationGate />` once in `src/app/layout.tsx`

Now SSR renders with default `lang="id"` and client first render also uses `lang="id"` (matching SSR), then after mount the persisted language is rehydrated, triggering a re-render with the user's choice. No more hydration warnings.

### Reactivity pattern (continued)
Every component using `t()` ALSO subscribes to `useI18n((s) => s.lang)` for re-render trigger (as in previous task). Verified with grep — all 13 files using `t()` also have the lang subscription.

## Task 2: 10 Advanced Features

All 10 features are pure frontend, use existing styling (glass, glass-nav-strong, pixel-corner, font-pixel), framer-motion for animations, and existing stores (cart, wishlist, admin-store, plus new loyalty + achievements stores).

### Feature 1: Social Proof Toast Notifications
- **Files:** `src/components/akuma/social-proof.tsx`
- Bottom-left toast every 15-30s (first one after 8s) with random name + item + city
- Slide-in animation (framer-motion spring), auto-dismiss after 5s
- Mounted deferred in MainLayout

### Feature 2: Loyalty Points System
- **Files:** `src/lib/loyalty.ts`, `src/components/akuma/loyalty-badge.tsx`
- Zustand store with localStorage persist
- Points: 100 per order × items count (added in checkout handleOrder)
- Tiers: Bronze (0), Silver (500), Gold (1500), Platinum (3000), Diamond (5000)
- Tier colors + emoji icons (🥉🥈🥇💎💠)
- Navbar badge shows tier icon + points; click → expandable panel with progress bar to next tier + tier ladder
- Mount gate (`mounted` state) to avoid SSR/CSR mismatch from localStorage

### Feature 3: Quick Reorder
- **Integrated into:** `src/components/akuma/checkout-view.tsx` (EmptyOrder component)
- Order history items now store a snapshot of items (gameSlug, gameName, gameEmoji, productId, productName, priceLabel, price, category)
- "Reorder" button (RotateCcw icon) on each history row → calls `useCart.getState().add()` for each snapshot item → toast + redirect to /checkout
- Snapshot saved in `localStorage.akuma-order-history` (backwards-compatible: old entries without snapshot just don't show Reorder button)

### Feature 4: Price History Chart
- **Files:** `src/components/akuma/price-history-chart.tsx`
- Mini sparkline SVG showing 30-day mock price history
- Deterministic random walk (seeded by current price) so chart is stable across renders
- Trend % indicator (green ▼ / red ▲)
- Shows lowest / current / highest prices
- Mounted inside store-view item modal (between price and actions)

### Feature 5: Game Difficulty Meter
- **Integrated into:** `src/components/akuma/store-view.tsx` (ProductCard component)
- Based on price: <5K=Easy (green), <15K=Medium (yellow), <30K=Hard (orange), >30K=Expert (red)
- Visual: 4-segment colored bar + label
- Added `price?` to ProductCard item prop type (uses item.price or falls back to parsing priceLabel)

### Feature 6: Smart Recommendations
- **Files:** `src/components/akuma/recommendations.tsx`
- "You Might Like" section below items in store-view (before "other games")
- Picks 3 items from OTHER games (deterministic shuffle seeded by currentGameSlug)
- Card format: game emoji + name + category + item name + description + price + "Add" button (with In Cart state)
- Uses cart store for add-to-cart functionality

### Feature 7: Achievement Badges
- **Files:** `src/lib/achievements.ts`, `src/components/akuma/achievement-toast.tsx`
- Zustand store with localStorage persist
- 6 badges: First Order, 5 Orders, First Review, Wishlist Master, Cart Full, Loyal Customer
- `checkAchievements(opts)` helper called from:
  - `checkout-view.tsx` handleOrder → checks orderCount + loyaltyPoints
  - `store-view.tsx` handleAddToCart → checks cartCount (Cart Full)
  - `store-view.tsx` StoreReviews handleSubmit → checks reviewCount (First Review)
  - `wishlist-button.tsx` toggle → checks wishlistCount (Wishlist Master)
- Toast shows celebratory animation (spring + scale-in icon) for 5s
- `lastHandledRef` prevents duplicate toasts for same unlock

### Feature 8: Floating Price Calculator
- **Files:** `src/components/akuma/price-calculator.tsx`
- Floating amber button (bottom-left, next to back-to-top)
- Modal: select game → pick items → adjust qty (± buttons) → see subtotal/discount/total
- Bundle 3+ items = 10% discount (shown with note)
- "Add All to Cart" button → calls cartAdd for each line × qty → toast with added/skipped counts
- Respects MAX_CART_ITEMS limit

### Feature 9: Order ETA Predictor
- **Integrated into:** `src/components/akuma/checkout-view.tsx` (OrderETAPredictor component)
- Per-item ETA based on price: <5K=30-60min, <15K=1-3h, <30K=4-8h, >30K=8-16h
- Sums min/max across all items in cart/order
- Shows in order summary: "⏱ Estimasi Selesai · Perkiraan {min} – {max}"
- Cyan accent color to distinguish from total

### Feature 10: Voice Search
- **Integrated into:** `src/components/akuma/navbar.tsx`
- Microphone button inside search dropdown (next to input)
- Uses Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`)
- Click → starts listening (lang="id-ID") → transcript auto-fills search → triggers AI search debounced
- Visual: pulsing red dot + ping animation while listening + "Mendengarkan... — Bicara sekarang" text
- Click again to stop; if browser unsupported, toast error
- Recognition ref stored in `recognitionRef` for cleanup

### MainLayout integration
Mounted in `src/app/(main)/layout.tsx` (deferred via DeferredLoader delay=2000ms):
- `<SocialProof />`
- `<AchievementToast />`
- `<PriceCalculator />`

All loaded via `next/dynamic` with `ssr: false` to avoid SSR issues with localStorage-backed stores.

## Build Verification

- `bun run lint` → ✅ passes, 0 errors, 0 warnings
- `bun run build` → ✅ passes, all 38 routes compile (static + dynamic)
- No new hydration warnings (fixed existing i18n hydration mismatch)

## Files Created (9)

1. `src/lib/loyalty.ts` — loyalty points zustand store
2. `src/lib/achievements.ts` — achievements zustand store + checkAchievements helper
3. `src/components/akuma/loyalty-badge.tsx` — navbar badge
4. `src/components/akuma/social-proof.tsx` — bottom-left toast
5. `src/components/akuma/achievement-toast.tsx` — celebratory toast
6. `src/components/akuma/recommendations.tsx` — "You Might Like" section
7. `src/components/akuma/price-history-chart.tsx` — SVG sparkline
8. `src/components/akuma/price-calculator.tsx` — floating calculator modal
9. `src/components/akuma/language-hydration-gate.tsx` — fixes i18n SSR/CSR hydration

## Files Modified (8)

1. `src/lib/i18n.ts` — added 100+ keys (ID + EN), `skipHydration: true`
2. `src/components/akuma/footer.tsx` — full i18n
3. `src/components/akuma/home-view.tsx` — remaining i18n (6th feature, headings, game cards)
4. `src/components/akuma/store-view.tsx` — full i18n + PriceHistoryChart + Recommendations + Difficulty Meter + achievement checks
5. `src/components/akuma/checkout-view.tsx` — full i18n + Quick Reorder + OrderETAPredictor + loyalty points + achievement checks
6. `src/components/akuma/navbar.tsx` — LoyaltyBadge + Voice Search + i18n for "Lihat semua game →" / "Game Tersedia" / search empty states
7. `src/components/akuma/wishlist-button.tsx` — achievement check (Wishlist Master)
8. `src/app/admin/(protected)/page.tsx` — full i18n (HelpBanner, status badges, quick actions, headings)
9. `src/app/(main)/layout.tsx` — mounted SocialProof, AchievementToast, PriceCalculator (deferred)
10. `src/app/layout.tsx` — mounted LanguageHydrationGate

## Notes for future tasks

- All 10 features are pure frontend; no backend changes needed
- Loyalty points awarding is in checkout-view's handleOrder (100 points × items count)
- Achievement checks are wired in 4 places (checkout, store-view add-to-cart, store-view review submit, wishlist-button toggle)
- The price-calculator respects MAX_CART_ITEMS (5) but doesn't pre-validate; it just adds items one by one (cart.add returns false if full/duplicate)
- Voice search uses `id-ID` lang; if user wants EN, they can change `rec.lang` in navbar.tsx
- All new components follow the existing project pattern: `useI18n((s) => s.t)` + `useI18n((s) => s.lang)` for reactivity
- The `LanguageHydrationGate` is a one-time mount in root layout; it just calls `useI18n.persist.rehydrate()` after first paint
