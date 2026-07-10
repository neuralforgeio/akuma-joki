# AKUMA JOKI — Worklog & Handover Document

> Repo: https://github.com/luminarydearx/akuma-joki
> Tema: Retro PixelArt (Joki & Store Roblox) — Next.js 16 App Router, TypeScript, Tailwind CSS 4, Framer Motion, Zustand.
> Dev server: http://localhost:3000 (sudah berjalan, dijalankan via `bun run dev`).

---

## Task ID: 1
Agent: Main (Z.ai Code)
Task: Tambahkan fitur widget Floating WhatsApp (Live Chat) ke project Next.js, lalu push hasilnya ke GitHub.

Work Log:
- Menganalisis repo `akuma-joki` (clone ke `/tmp/akuma-check`) untuk memahami tema Retro PixelArt: palette neon purple `#a020f0`, silver `#e5e5e5`, ink black `#0a0a0a`, font `Press_Start_2P` (var `--font-pixel`), helper classes `.pixel-corner`, `.pixel-border`, `.btn-shine`, `.scanlines`, `.text-glow-neon`.
- Menemukan bahwa komponen `src/components/akuma/whatsapp-widget.tsx` SUDAH ada di commit `563c6fd`, namun dalam keadaan **corrupt** (karakter `[` hilang di banyak tempat: `const ounted`, `const asNew`, `const essages`, `}, essages,`) sehingga tidak bisa compile & gagal lint (`react-hooks/set-state-in-effect`).
- Meng-sync file repo akuma-joki ke `/home/z/my-project` (preserve infra sandbox: Caddyfile, .zscripts, mini-services, examples, dev.log) dan mengganti `.git` dengan history akuma-joki sehingga remote `origin` = `https://github.com/luminarydearx/akuma-joki.git`.
- Refactor `src/components/akuma/whatsapp-widget.tsx`:
  - Hapus state `mounted` & `useEffect` yang memanggil `setState` sync (pemicu lint error `react-hooks/set-state-in-effect`).
  - Ubah tipe `Msg.ts` menjadi optional (`ts?: number`) — welcome message dirender tanpa timestamp (server-only), timestamp hanya diisi untuk pesan client-side (user & konfirmasi CS). Mencegah hydration mismatch sekaligus compliant dengan rule lint.
  - Perbaiki docstring CJK (`依赖` → `dependency`).
  - Hapus prop `mounted` dari komponen `Bubble`.
- Verifikasi `bun run lint` → 0 error, 0 warning.
- Verifikasi via **agent-browser** (end-to-end golden path):
  - `open http://localhost:3000/` → HTTP 200, title "AKUMA JOKI — Joki & Store Roblox Terpercaya", no console errors, no runtime errors.
  - Floating button terdeteksi: `button "Buka live chat WhatsApp"`.
  - Klik → popup chat box terbuka dengan animasi slide-up + fade-in (Framer Motion spring).
  - Header: avatar "AJ" (green glow ring), nama "AKUMA JOKI", badge "CS", status "ONLINE · BIASANYA BALAS DALAM BEBERAPA MENIT".
  - Welcome bubble CS (kiri): "Halo! 👋 Selamat datang di Akuma Joki. Ada yang bisa kami bantu?"
  - Quick reply chips: "CEK HARGA JOKI", "STATUS PESANAN", "CHAT ADMIN".
  - Input "Ketik pesan" + tombol kirim (ikon paper plane). Tombol kirim disabled saat input kosong, enabled saat diisi.
  - Klik quick reply "CEK HARGA JOKI" → bubble user muncul (kanan, hijau), tab baru terbuka ke `https://api.whatsapp.com/send/?phone=6281234567890&text=Cek+Harga+Joki` (teks ter-URL-encode benar), lalu setelah ~950ms muncul typing indicator (3 dots animasi) → bubble CS konfirmasi (kiri): "Pesan dikirim, mengarahkan ke WhatsApp...".
  - Esc / tombol X → tutup popup dengan animasi exit.
- Update `.gitignore` agar file infra sandbox tidak ter-commit: `dev.log`, `server.log`, `/db/`, `/.zscripts/`, `/examples/`, `/mini-services/`, `Caddyfile`, `download/`.
- Commit lokal dengan pesan persis sesuai permintaan: `feat: tambah widget floating whatsapp live chat` → commit `99402a0`.
- Mencoba push ke GitHub dengan token yang diberikan user (`ghp_...NLQ`). **Token TIDAK VALID** — GitHub API mengembalikan HTTP 401 Unauthorized (token expired/dicabut/salah). Push GAGAL.
- Membersihkan token dari remote URL (alasan keamanan) → remote kembali ke `https://github.com/luminarydearx/akuma-joki.git`.
- Membuat scheduled task `webDevReview` setiap 15 menit (cron `0 */15 * * * ?`, tz Asia/Jakarta), job_id 263411.

Stage Summary:
- Widget WhatsApp Live Chat **berfungsi penuh & terverifikasi end-to-end** di preview (rendering + interaksi + redirect wa.me + URL-encoding teks).
- Komponen: `src/components/akuma/whatsapp-widget.tsx` (lint clean, fix kode corrupt dari commit sebelumnya).
- Integrasi: `src/app/layout.tsx` merender `<WhatsAppWidget />` di `<body>` (muncul di semua halaman).
- Commit `99402a0` sudah siap di lokal branch `main`, tapi **BELUM ter-push** karena token GitHub invalid.
- Scheduled task webDevReview aktif (job_id 263411).

---

## Status Project Saat Ini (Assessment)

**Stabil & runnable.** Dev server Next.js 16 (Turbopack) berjalan di port 3000, halaman `/` merender tanpa error, lint 0 error. Widget WhatsApp sudah terintegrasi global via root layout dan lolos QA end-to-end via agent-browser.

Struktur project akuma-joki:
- `src/app/layout.tsx` — root layout (dark mode, font pixel, render WhatsAppWidget global)
- `src/app/(main)/` — route group dengan Navbar + Footer + Framer Motion page transition
- `src/app/(main)/page.tsx` → HomeView
- `src/app/(main)/store/[slug]/page.tsx` → store detail (Blox Fruits, Expedition Antarctica, Retail Tycoon 2)
- `src/app/(main)/checkout/page.tsx` → checkout
- `src/app/takedown/page.tsx` — halaman khusus tanpa chrome
- `src/components/akuma/` — komponen tema: navbar, footer, pixel-button, home-view, store-view, checkout-view, backgrounds, reveal, **whatsapp-widget** (baru diperbaiki)
- `src/lib/games-data.ts` — data game (GAMES array)
- Tema CSS di `src/app/globals.css` (pixel borders, neon glow, scanlines, starfield, moving grid, CRT effects)

## Current Goals / Completed Modifications / Verification Results

**Completed:**
1. ✅ Widget WhatsApp Live Chat — floating button (pulse ring, badge notif), popup chat box (slide-up spring animation), header CS dengan avatar + status online, welcome bubble, 3 quick reply chips, input + send button, typing indicator, redirect ke wa.me dengan URL-encoding, bubble konfirmasi CS.
2. ✅ Integrasi global di root layout (muncul di semua route: /, /store/*, /checkout, /takedown).
3. ✅ Lint clean (0 error).
4. ✅ QA agent-browser end-to-end: render, open popup, quick reply → wa.me redirect, bubble konfirmasi.
5. ✅ Commit lokal `99402a0`.
6. ✅ Scheduled task webDevReview (setiap 15 menit).

**Verification results:**
- HTTP 200 di `/`, no console errors, no runtime errors.
- agent-browser: semua elemen interaktif terdeteksi & berfungsi (open/close, fill input, send via quick reply, redirect wa.me dengan teks ter-encode).
- Lint: 0 problems.

## Unresolved Issues / Risks / Priority Recommendations

### ❌ UNRESOLVED — CRITICAL: Push ke GitHub GAGAL (token invalid)
- Token `ghp_...NLQ` yang diberikan user mengembalikan HTTP 401 saat diverifikasi via `https://api.github.com/user`.
- Commit `99402a0` (pesan: `feat: tambah widget floating whatsapp live chat`) **sudah siap di lokal** tapi belum ter-push.
- **Rekomendasi prioritas #1**: User perlu memberikan GitHub Personal Access Token (classic, scope `repo`) yang baru/valid, lalu jalankan:
  ```bash
  cd /home/z/my-project
  git remote set-url origin https://x-access-token:<TOKEN_BARU>@github.com/luminarydearx/akuma-joki.git
  git push origin main
  git remote set-url origin https://github.com/luminarydearx/akuma-joki.git  # cleanup token
  ```

### ⚠️ RISIKO — Nomor WhatsApp placeholder
- `WHATSAPP_NUMBER = "6281234567890"` masih placeholder. User perlu ganti dengan nomor CS asli di `src/components/akuma/whatsapp-widget.tsx` baris ~21.

### 📋 REKOMENDASI NEXT PHASE (untuk scheduled webDevReview)
1. **Fitur tambahan**: simpan riwayat chat ke `localStorage` (persisten antar sesi), dengan tombol "Hapus percakapan".
2. **Fitur tambahan**: auto-open popup setelah X detik jika user belum interaksi (engagement booster), dengan throttle sessionStorage.
3. **Fitur tambahan**: deteksi jam operasional — jika di luar jam kerja, ubah status menjadi "Offline · Balas besok" dan ubah welcome message.
4. **Styling detail**: tambahkan sound effect "blip" saat pesan masuk/dikirim (optional, dengan toggle mute).
5. **Styling detail**: animasi "bubble pop" lebih ekspresif untuk bubble konfirmasi CS (scale + bounce).
6. **A11y**: tambahkan `role="log"` pada area chat body, trap focus saat popup terbuka, restore focus ke floating button saat ditutup.
7. **Performa**: lazy-load widget (next/dynamic dengan `ssr: false`) agar tidak block initial paint — widget tidak perlu SSR.
8. **Responsive**: verifikasi widget di viewport mobile kecil (320px) — pastikan popup tidak overflow.

### Konfigurasi widget (untuk referensi)
```
WHATSAPP_NUMBER = "6281234567890"  // GANTI
CS_NAME = "Akuma Joki"
WELCOME_MESSAGE = "Halo! 👋 Selamat datang di Akuma Joki. Ada yang bisa kami bantu?"
QUICK_REPLIES = ["Cek Harga Joki", "Status Pesanan", "Chat Admin"]
REDIRECT_MSG = "Pesan dikirim, mengarahkan ke WhatsApp..."
```

---

## Task ID: 2
Agent: webDevReview (scheduled, job_id 263411)
Task: Scheduled QA + enhancement round — assess status, fix bugs, add features & styling details.

Work Log:
- Membaca worklog.md fase sebelumnya: widget v1 berfungsi, lint clean, commit `99402a0` lokal (push GAGAL karena token invalid).
- **QA lintasan semua route** via curl: `/`, `/store/blox-fruits`, `/store/expedition-antarctica`, `/store/retail-tycoon-2`, `/checkout` → semua 200. `/takedown` → 307 redirect ke `/` (intentional, middleware `src/middleware.ts` berdasarkan `config.json` `isTakedown:false`).
- **QA via agent-browser** (desktop 1440×900 & mobile 375×720):
  - Homepage HTTP 200, zero console errors, zero runtime errors.
  - Widget floating button muncul di SEMUA halaman (/, /store/blox-fruits, /checkout) — konfirmasi integrasi global via root layout.
  - Mobile 375px: popup terbuka penuh, semua elemen hadir (header, body, quick replies, input), tidak overflow.
- **Rewrite widget ke v2** (`src/components/akuma/whatsapp-widget.tsx`, +633/-129 baris):
  - **localStorage persistence** via `useSyncExternalStore` (chat history key `akuma-wa-chat-v2`, mute key `akuma-wa-mute-v2`). Lint-clean (tidak trigger `react-hooks/set-state-in-effect` karena pakai external store pattern, bukan setState sync di effect).
  - **Clear chat button** (ikon Trash2) di header → reset ke welcome message, hapus localStorage.
  - **Operating hours detection**: jam 09:00–23:00 WIB = Online (hijau), di luar itu = Offline (abu-abu). Status dot, avatar color, substatus text adaptif. Clock di-update tiap 60s via interval (setState async di callback → lint-clean).
  - **Sound effects** via Web Audio API (oscillator square wave): rising blip saat send, falling blip saat recv. Gated by mute state. Tidak perlu file asset.
  - **Mute toggle** (ikon Bell/BellOff) di header, persisted ke localStorage.
  - **Auto-open** setelah 12 detik jika user belum interaksi, throttle via `sessionStorage` (sekali per session). setState di setTimeout callback → lint-clean.
  - **A11y**: `role="log"` + `aria-live="polite"` pada chat body, **focus trap** (Tab/Shift+Tab cycle dalam dialog saat terbuka), **focus restore** ke floating button saat ditutup, `aria-pressed` pada mute, `aria-label` deskriptif pada semua tombol.
  - **Quick reply "Jam Operasional"** (ke-4) → jawab LOKAL tanpa buka wa.me (info jam buka). Bubble CS dengan border neon purple untuk membedakan.
  - **Read receipt** (DoubleCheck SVG) pada bubble user setelah redirect ke wa.me (flag `sent:true` di-set 500ms setelah kirim).
  - **Char counter** `0/500` di bawah input, berubah merah (`#ff3b6b`) saat >400 char.
  - **Lazy-load** via `next/dynamic` `ssr:false` di `src/components/akuma/whatsapp-widget-loader.tsx` → widget tidak block initial paint, Framer Motion bundle hanya di-load setelah hydration. Layout.tsx diupdate import ke loader.
- **Styling enhancements**:
  - Dual pulse rings (staggered 1.1s) pada floating button.
  - Animated moving grid background di chat body (keyframes `wa-grid-move`).
  - Bouncing typing avatar (Framer Motion y:[0,-2,0] loop).
  - Header status "Sedang mengetik..." (neon purple `#c44bff`) saat typing, dengan AnimatePresence crossfade.
  - Bubble pop spring lebih ekspresif untuk CS redirect message (stiffness 500, damping 14).
  - Footer notice "DITERUSKAN KE WHATSAPP" di bawah input.
  - Unread count badge dinamis (jumlah pesan CS setelah id:1) saat popup tertutup.
  - Quick replies dengan emoji prefix (💰📦👤🕐).
  - Date divider otomatis antar hari berbeda.
  - Tinggi popup dinaikkan 30rem→32rem.
- **Verifikasi end-to-end via agent-browser** (semua passed):
  - Persistence: kirim pesan → reload → chat history tersimpan & ter-restore (welcome + user msg + CS reply). localStorage `akuma-wa-chat-v2` berisi 5 pesan dengan `sent:true` flags.
  - Clear chat: klik tombol → chat reset ke welcome, localStorage jadi null, quick replies muncul lagi (userSent=false).
  - Mute toggle: klik → label flip ("Matikan suara"↔"Aktifkan suara"), localStorage mute "0"↔"1", persisted across reload.
  - Quick reply "Jam Operasional": jawab lokal, TIDAK buka tab wa.me (hanya 1 tab aktif), bubble CS muncul dengan info jam buka.
  - Quick reply "Cek Harga Joki": buka tab wa.me dengan `?text=Cek+Harga+Joki` (URL-encoded benar).
  - Char counter: fill 450 char → "450/500" tampil (merah), send → wa.me terima 450 char ter-encode.
  - Read receipt: `sent:true` persisted di localStorage, DoubleCheck SVG render di DOM.
  - Operating hours: status "ONLINE · BIASANYA BALAS DALAM BEBERAPA MENIT" (sesuai jam 12:12 WIB, dalam jam buka).
  - `role="log"` pada chat body terverifikasi di a11y tree.
  - Mobile 375px: semua elemen terbuka tanpa overflow.
  - Zero console errors, zero runtime errors across semua route.
- `bun run lint` → 0 error, 0 warning.
- Commit `d0a06d2` (lokal, belum ter-push karena token GitHub masih invalid).

Stage Summary:
- Widget v2 production-ready dengan 15+ fitur baru & penyempurnaan styling.
- Lint clean, QA end-to-end passed di desktop & mobile, zero errors.
- Persistence (chat + mute) terverifikasi across reload.
- Lazy-load mengurangi beban initial paint.
- A11y: focus trap, role=log, focus restore — compliant.
- Commit `d0a06d2` siap di lokal branch `main` (gabungan: `99402a0` v1 + `d0a06d2` v2).

---

## Status Project Saat Ini (Assessment — Fase 2)

**Stabil & feature-rich.** Dev server Next.js 16 (Turbopack) berjalan di port 3000. Semua route 200. Widget WhatsApp v2 terintegrasi global, lint 0 error, QA end-to-end passed (desktop + mobile). Persistence localStorage terverifikasi. A11y compliant (focus trap, role=log).

**Perubahan fase ini (commit `d0a06d2`):**
- `src/components/akuma/whatsapp-widget.tsx` — rewrite v2 (+633/-129 baris)
- `src/components/akuma/whatsapp-widget-loader.tsx` — baru (lazy-load wrapper, 18 baris)
- `src/app/layout.tsx` — import loader (1 baris berubah)

**Commits lokal (belum ter-push):**
1. `99402a0` — feat: tambah widget floating whatsapp live chat (v1)
2. `d0a06d2` — feat(whatsapp-widget): v2 — persistence, operating hours, sound, a11y, lazy-load

## Current Goals / Completed Modifications / Verification Results

**Completed (fase 2):**
1. ✅ localStorage persistence (chat + mute) via useSyncExternalStore — lint clean
2. ✅ Clear chat button dengan reset & localStorage cleanup
3. ✅ Operating hours detection (09:00–23:00 WIB) — Online/Offline adaptif
4. ✅ Sound effects (Web Audio API) + mute toggle (persisted)
5. ✅ Auto-open 12s + sessionStorage throttle
6. ✅ A11y: focus trap, focus restore, role=log
7. ✅ Lazy-load via next/dynamic ssr:false
8. ✅ Quick reply "Jam Operasional" (local reply, no wa.me)
9. ✅ Read receipt (DoubleCheck) pada user messages
10. ✅ Char counter 0/500 (red >400)
11. ✅ Styling: dual pulse rings, animated grid bg, bouncing typing avatar, header typing status, bubble pop spring, footer notice, unread badge, emoji quick replies, date divider
12. ✅ QA end-to-end via agent-browser (desktop + mobile, semua fitur terverifikasi)
13. ✅ Lint 0 error

**Verification results:**
- HTTP 200 di semua route (/, /store/*, /checkout). /takedown → 307 redirect ke / (intentional middleware).
- agent-browser: persistence (5 pesan across reload), clear chat (localStorage null), mute toggle (localStorage "0"/"1"), quick reply lokal (no wa.me tab), char counter (450/500 red), read receipt (sent:true + DoubleCheck SVG), operating hours (ONLINE at 12:12 WIB), role=log, mobile 375px no overflow.
- Zero console errors, zero runtime errors.
- Lint: 0 problems.

## Unresolved Issues / Risks / Priority Recommendations

### ❌ UNRESOLVED — CRITICAL: Push ke GitHub MASIH GAGAL (token invalid)
- Token GitHub dari user fase 1 (`ghp_...NLQ`) mengembalikan HTTP 401. Commit `99402a0` + `d0a06d2` belum ter-push.
- **Rekomendasi prioritas #1**: User berikan token baru (classic, scope `repo`), lalu:
  ```bash
  cd /home/z/my-project
  git remote set-url origin https://x-access-token:<TOKEN_BARU>@github.com/luminarydearx/akuma-joki.git
  git push origin main
  git remote set-url origin https://github.com/luminarydearx/akuma-joki.git
  ```

### ⚠️ RISIKO — Nomor WhatsApp placeholder
- `WHATSAPP_NUMBER = "6281234567890"` masih placeholder. Ganti di `src/components/akuma/whatsapp-widget.tsx` (sekarang di blok KONFIGURASI, mudah ditemukan).

### 📋 REKOMENDASI NEXT PHASE (untuk webDevReview berikutnya)
1. **Quick reply dinamis per game**: deteksi pathname (`/store/blox-fruits`) → ubah quick reply ke "Joki Blox Fruits", "Jual Item", dll. Context-aware.
2. **Pre-chat form opsional**: sebelum kirim pertama, minta nama (opsional) → personalize sapaan CS.
3. **Multi-language**: toggle ID/EN untuk welcome message & quick replies (pakai next-intl yang sudah ter-install).
4. **File/foto preview**: izinkan paste gambar → preview thumbnail di bubble (tetap lewat wa.me via teks URL, atau instruksi "kirim foto via WhatsApp").
5. **Snooze auto-open**: tombol "Jangan tampilkan lagi 7 hari" (localStorage flag) untuk user yang tidak ingin auto-open.
6. **Analytics event**: emit custom event (`window.dispatchEvent`) saat open/send/close — siap untuk integrasi Google Analytics/Plausible nanti.
7. **Keyboard shortcut**: `Ctrl/Cmd + Shift + W` untuk toggle widget (power user).
8. **Sound option**: pilih variasi blip (retro 8-bit / modern) via setting.
9. **A11y audit**: jalankan axe-core via agent-browser untuk audit WCAG penuh.
10. **Dark/light toggle widget**: walau site dark-only, widget bisa match jika site nanti support light mode.
11. **Test reduce-motion**: pastikan `prefers-reduced-motion` menonaktifkan animasi Framer Motion & pulse rings.
12. **Buat halaman test**: route `/__wa-widget` (dev-only) untuk isolate widget testing.

### Konfigurasi widget v2 (untuk referensi)
```ts
WHATSAPP_NUMBER = "6281234567890"  // GANTI
CS_NAME = "Akuma Joki"
WELCOME_MESSAGE = "Halo! 👋 Selamat datang di Akuma Joki..."
OFFLINE_WELCOME = "Halo! 👋 Saat ini kami sedang OFFLINE..."
QUICK_REPLIES = [Cek Harga Joki 💰, Status Pesanan 📦, Chat Admin 👤, Jam Operasional 🕐]
OPEN_HOUR = 9, CLOSE_HOUR = 23  // WIB
AUTO_OPEN_DELAY = 12000  // ms
// localStorage keys: akuma-wa-chat-v2, akuma-wa-mute-v2
// sessionStorage key: akuma-wa-auto-v2
```
