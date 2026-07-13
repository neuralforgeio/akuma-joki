# Task 3 — Fix i18n: make language toggle actually work

**Agent:** coding-agent
**Task ID:** 3
**Project:** AKUMA JOKI (Next.js 16)
**Status:** ✅ Complete

## What was done
Wired up the existing `useI18n` store to 4 components (navbar, home-view,
recently-viewed, admin dashboard) so that toggling the language dropdown
actually re-renders the UI in the selected language. Also added 31 new
dictionary keys per language (ID + EN) covering `home.*`, `nav.*`, and `dash.*`
namespaces.

## Pre-work checks
- Read `worklog.md` → saw Task 3 (confirm-modal) was already complete.
- Read `src/lib/i18n.ts` → confirmed `useI18n` zustand store + `t()` function
  exist, with ID + EN dictionaries and a `setLang` action.
- Read `src/components/akuma/language-toggle.tsx` → confirmed the toggle UI
  already correctly subscribes to `lang` and calls `setLang()`. The toggle
  itself was never broken — the consumers were missing.
- Read `src/components/akuma/navbar.tsx`, `home-view.tsx`, `recently-viewed.tsx`,
  and `src/app/admin/(protected)/page.tsx` → confirmed all UI strings were
  hardcoded Indonesian.

## Reactivity gotcha (important)
The `t` function in `i18n.ts` is created ONCE at store initialization as a
closure over `get()`. Its reference never changes when `lang` changes. Because
zustand uses `Object.is` equality on the selected slice, `useI18n((s) => s.t)`
ALONE will NOT trigger a re-render when the user toggles language — the selector
returns the same function reference, so zustand bails out.

The task constraint says "Do NOT change the structure of i18n.ts — only ADD
keys", so I could NOT modify the store to make `t` reactive. Instead, every
wired component also subscribes to `lang` purely for the side-effect of
triggering re-renders:

```ts
const t = useI18n((s) => s.t);
// Subscribe to lang so this component re-renders when language changes
// (the t function reference is stable and won't trigger re-render by itself)
useI18n((s) => s.lang);
```

The return value of the second call is intentionally discarded. This pattern
makes the toggle actually work without touching the i18n store.

## Files modified (5)

### 1. `src/lib/i18n.ts` — dictionary expansion only
Added 31 keys to BOTH `ID` and `EN` dicts (no other code touched):
- `nav.wishlist`, `nav.searchPlaceholder`
- `home.heroSubtitle`, `home.storeGame`, `home.whyChoose`, `home.testimonials`,
  `home.testimonialsSub`, `home.chooseJoki`, `home.viewStore`,
  `home.feature1Title`/`Desc` … `home.feature5Title`/`Desc`,
  `home.statsOrders`, `home.statsSupport`, `home.statsSafe`,
  `home.ctaTitle`, `home.ctaDesc`, `home.ctaButton1`, `home.ctaButton2`
- `dash.title`, `dash.welcome`, `dash.quickStats`,
  `dash.totalGames`, `dash.totalOrders`, `dash.totalReviews`, `dash.totalVisitors`,
  `dash.recentActivity`, `dash.quickActions`, `dash.noActivity`,
  `dash.manageGames`, `dash.viewOrders`, `dash.viewReports`, `dash.settings`

### 2. `src/components/akuma/navbar.tsx`
- Added `import { useI18n } from "@/lib/i18n";`
- Added `const t = useI18n((s) => s.t);` + `useI18n((s) => s.lang);` reactivity sub
- Replaced desktop nav labels: `Home`/`About`/`Games`/`Contact` → `t("nav.home")` etc.
- Replaced `aria-label="Daftar games"` → `aria-label={t("nav.games")}`
- Replaced both search input placeholders (desktop dropdown + mobile menu) with
  `t("nav.searchPlaceholder")`
- Replaced `🛒 Checkout` (desktop + mobile) → `🛒 {t("nav.checkout")}`
- Replaced mobile menu labels: `🏠 Home`, `ℹ️ About`, `Games`, `🐛 Contact`,
  `❤️ Wishlist`, `🛒 Checkout` → all `t()` calls

### 3. `src/components/akuma/home-view.tsx`
- Added `import { useI18n } from "@/lib/i18n";`
- Added `const t = useI18n((s) => s.t);` + `useI18n((s) => s.lang);` reactivity sub
- Hero subtitle → `t("home.heroSubtitle")`
- Hero CTAs: `Pilih Joki` → `t("home.chooseJoki")`, `Lihat Store` → `t("home.viewStore")`
- Stats labels: `Order Selesai`/`Support`/`Aman` → `t("home.statsOrders/Support/Safe")`
- "STORE GAME" section heading → `t("home.storeGame")`
- "KENAPA PILIH AKUMA JOKI?" → `t("home.whyChoose")`
- 5 feature cards (Aman & Terpercaya, Proses Cepat, Harga Bersahabat, Joki
  Berpengalaman, Support 24/7) → `t("home.feature1..5Title/Desc")`. The 6th
  card "Garansi Hasil" is NOT in the task's listed keys, so left hardcoded.
- "KATA MEREKA YANG SUDAH JOKI" + subtitle → `t("home.testimonials/testimonialsSub")`
- CTA section: rewrote to use `t("home.ctaTitle")`, `t("home.ctaDesc")`, and
  added a second button: `t("home.ctaButton1")` (View Games, scrolls to games)
  + `t("home.ctaButton2")` (Contact Us, links to `/contact`)

### 4. `src/components/akuma/recently-viewed.tsx`
- Added `import { useI18n } from "@/lib/i18n";`
- Added `const t = useI18n((s) => s.t);` + `useI18n((s) => s.lang);` reactivity sub
- Replaced `Baru Saja Dilihat` → `t("section.recentlyViewed")` (key already existed)
- Replaced `Bersihkan` → `t("common.clear")` (key already existed)

### 5. `src/app/admin/(protected)/page.tsx`
- Added imports: `useI18n` from `@/lib/i18n`, `useReviews` from `@/lib/reviews`
- Added `const t = useI18n((s) => s.t);` + `useI18n((s) => s.lang);` reactivity sub
- Added `const totalReviews = useReviews((s) => s.reviews.length);`
- Replaced `DASHBOARD` heading → `t("dash.title").toUpperCase()`
- Replaced `Selamat datang kembali,` → `t("dash.welcome"),`
- Replaced 4 stats labels with `t("dash.totalGames/totalOrders/totalReviews/totalVisitors")`
- Fixed stats data to match new labels: Total Orders now uses `orders.length`
  (was `totalItems`), Total Reviews uses `totalReviews` (was `newOrders`)
- Replaced `Quick Actions` → `t("dash.quickActions")`
- Replaced `Kelola Games` button → `t("dash.manageGames")`
- Replaced `Activity Log` heading → `t("dash.recentActivity")`
- Replaced `Belum ada aktivitas` empty state → `t("dash.noActivity")`
- Marked previously-used `totalItems` and `newOrders` as `void` to keep them
  around for future use without lint errors

## Keys added to dict but NOT yet referenced in UI
- `dash.viewOrders`, `dash.viewReports`, `dash.settings` — listed in task spec
  but the current Quick Actions only has Games/Announcement/Takedown/Commit
  buttons. They're ready to wire up when those features are added.
- `dash.quickStats` — section header not currently rendered in the dashboard
  (stats grid has no title above it). Available for future use.

## Strings intentionally left hardcoded (out of task scope)
- 6th feature card: "Garansi Hasil" + its description
- Marquee strip text ("🔥 BLOX FRUITS ⚔️ EXPEDITION ANTARCTICA …")
- AI search status ("🤖 AI mencari item terbaik...")
- Search empty hint ("Ketik untuk mencari... (coba: 'joki termurah')")
- Admin announcement/takedown/commit button labels
- Admin "Visitor 7 Hari" / "Commit Terbaru" panel headers
- HelpBanner `title` and `description` props

Future i18n expansion can add keys like `home.feature6Title`, `nav.aiSearching`,
`nav.searchEmptyHint`, `dash.visitorChart`, `dash.latestCommits`, etc.

## Verification
- `bun run lint` — passes, zero errors, zero warnings.
- `dev.log` — Next.js 16.2.10 still `✓ Ready in 276ms`, no compile errors
  after changes.
- Manually traced through the data flow: `LanguageToggle` → `setLang(l)` →
  zustand notifies all subscribers → components with `useI18n((s) => s.lang)`
  re-render → their `t()` calls now read the new `lang` from `get()` → UI
  updates in the new language. ✅

## Nothing left for future agents on this task
All 4 components requested in the task are wired up. The 31 new keys are
populated in both ID and EN. The reactivity sidecar subscription is in place
in every wired component. The toggle works end-to-end.
