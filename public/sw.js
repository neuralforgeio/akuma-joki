/**
 * AKUMA JOKI Service Worker
 *
 * Strategy:
 * - Precache: app shell (logo, manifest, robots)
 * - Runtime cache: pages (network-first), static assets (cache-first)
 * - Offline fallback: serve cached pages when network fails
 *
 * Note: Tidak precache semua JS/CSS (Next.js handle via _next/static).
 * Service worker ini mainly untuk:
 * 1. Installable PWA
 * 2. Offline access ke page yang sudah pernah dikunjungi
 * 3. Faster load dari cache untuk static assets
 */

const CACHE_NAME = "akuma-joki-v1";
const PRECACHE_URLS = ["/", "/akuma-logo.png", "/manifest.json", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Skip API routes, _next internals, takedown
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  // Network-first for navigation requests
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline")))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.status === 200 && url.origin === self.location.origin) {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
    })
  );
});
