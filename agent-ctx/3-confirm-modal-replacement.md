# Task 3 — Replace confirm() / alert() with confirmAction() modal

**Agent:** coding-agent
**Task ID:** 3
**Project:** AKUMA JOKI (Next.js 16)
**Status:** ✅ Complete

## What was done
Replaced 14 `confirm()` calls and 1 `alert()` call across 11 files with the project's
custom `confirmAction()` helper from `@/lib/confirm-modal`.

## Pre-work checks
- Read `worklog.md` → did not exist yet (this is the first task record).
- Read `src/lib/confirm-modal.ts` → confirmed `confirmAction()` helper exists
  (zustand store + `show()` method + `onConfirm` callback pattern).
- Read `src/components/akuma/confirm-modal.tsx` → confirmed `<ConfirmModal/>`
  component exists and supports `danger` / `warning` / `info` variants.
- Grep confirmed `<ConfirmModal/>` is already mounted in `src/app/layout.tsx`.

## Files modified (11)
1. `src/components/akuma/wishlist-view.tsx` — Clear All Wishlist (danger)
2. `src/app/admin/(protected)/about/page.tsx` — Reset About Page (warning)
3. `src/app/admin/(protected)/dev-vercel/page.tsx` — 4 replacements:
   - Delete env var (danger)
   - Instant Rollback (warning)
   - Promote to Production (info)
   - Cancel Deploy (danger)
4. `src/app/admin/(protected)/pesanan/page.tsx` — Delete order (danger)
5. `src/app/admin/(protected)/reports/page.tsx` — Delete report (danger)
6. `src/app/admin/(protected)/settings/page.tsx` — Reset all data (danger)
7. `src/app/admin/(protected)/artifact/page.tsx` — Delete artifact (danger)
8. `src/app/admin/(protected)/commit/page.tsx` — 2 replacements:
   - Rollback commit (warning)
   - Trigger Vercel deploy (info, async onConfirm)
9. `src/app/admin/(protected)/games/[slug]/page.tsx` — Delete category (danger)
10. `src/app/admin/(protected)/games/page.tsx` — Delete game (danger)
11. `src/components/admin/avatar-crop.tsx` — File too big alert (warning, OK/Tutup)

## Patterns used
- `if (confirm(x)) action` → `confirmAction({ ..., onConfirm: () => action })`
- `if (!confirm(x)) return; rest` → `confirmAction({ ..., onConfirm: () => rest })`
- `alert(x)` → `confirmAction({ variant: "warning", confirmLabel: "OK", cancelLabel: "Tutup", onConfirm: () => {} })`
- Async callbacks: `onConfirm: async () => { await fetch(...) }` (used in dev-vercel env delete + commit Vercel deploy)

## Verification
- `bun run lint` — passes, zero errors.
- Grep for `\b(confirm|alert)\s*\(` in `src/` — no matches (all native calls removed).
- `dev.log` shows Next.js 16.2.10 ready with no compile errors.

## Nothing left for future agents on this task
All 15 replacements done. The `ConfirmModal` is mounted globally so no extra wiring needed
in any of these files — just import `confirmAction` and call it.
