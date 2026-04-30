/* Bahratal offline service worker.
 *
 * Strategy:
 *   - Install: pre-cache the app shell (HTML, Leaflet vendor files, manifest, favicon, icons, blank tile).
 *   - Activate: in the background, pre-cache every map tile from tiles-manifest.json so the
 *     map works fully offline after the first visit.
 *   - Fetch (same-origin GETs):
 *       * navigation requests  -> network-first, fall back to cached index page
 *       * everything else      -> cache-first, fill cache from network on miss (stale-while-revalidate-ish)
 *   - Cross-origin requests are passed through untouched.
 *
 * Bump CACHE_VERSION to invalidate every cache (forces re-download on next visit).
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `bahratal-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `bahratal-runtime-${CACHE_VERSION}`;
const TILES_CACHE = `bahratal-tiles-${CACHE_VERSION}`;

const BASE = new URL(self.registration.scope).pathname; // e.g. "/bahratal/"

const SHELL_URLS = [
  BASE,
  `${BASE}favicon.svg`,
  `${BASE}favicon.ico`,
  `${BASE}manifest.webmanifest`,
  `${BASE}icons/icon-180.png`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  `${BASE}vendor/leaflet/leaflet.css`,
  `${BASE}vendor/leaflet/leaflet.js`,
  `${BASE}vendor/leaflet/images/marker-icon.png`,
  `${BASE}vendor/leaflet/images/marker-icon-2x.png`,
  `${BASE}vendor/leaflet/images/marker-shadow.png`,
  `${BASE}vendor/leaflet/images/layers.png`,
  `${BASE}vendor/leaflet/images/layers-2x.png`,
  `${BASE}tiles/blank.png`,
];

// ── Install: pre-cache the small, stable app shell ──
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // addAll is atomic; if any single URL fails the whole install fails. Use individual puts to be lenient.
    await Promise.all(SHELL_URLS.map(async url => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res);
      } catch (e) { /* ignore individual failures, runtime cache will pick them up */ }
    }));
    await self.skipWaiting();
  })());
});

// ── Activate: claim clients, drop old caches, kick off background tile pre-cache ──
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const valid = new Set([SHELL_CACHE, RUNTIME_CACHE, TILES_CACHE]);
    await Promise.all(keys.filter(k => !valid.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
    // Don't await: tile pre-cache shouldn't block activation.
    precacheTiles().catch(err => console.warn('[sw] tile pre-cache failed:', err));
  })());
});

async function precacheTiles() {
  let manifest;
  try {
    const res = await fetch(`${BASE}tiles-manifest.json`, { cache: 'reload' });
    if (!res.ok) return;
    manifest = await res.json();
  } catch (e) {
    return;
  }
  if (!Array.isArray(manifest) || manifest.length === 0) return;

  const cache = await caches.open(TILES_CACHE);
  // Throttled parallel fetch so we don't hammer the device or duplicate already-cached tiles.
  const CONCURRENCY = 6;
  let i = 0;
  async function worker() {
    while (i < manifest.length) {
      const idx = i++;
      const path = manifest[idx];
      const url = `${BASE}${path}`;
      const hit = await cache.match(url);
      if (hit) continue;
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res);
      } catch (e) { /* ignore; will retry on next activation */ }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

// ── Fetch: serve from cache first for assets, network-first for navigations ──
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // pass-through for cross-origin
  if (!url.pathname.startsWith(BASE)) return;      // outside our scope

  // Navigation requests (HTML): network-first so updates show immediately when online.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put(BASE, fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(BASE))
          || (await cache.match(req))
          || Response.error();
      }
    })());
    return;
  }

  // Tiles: dedicated cache, cache-first.
  if (url.pathname.startsWith(`${BASE}tiles/`)) {
    event.respondWith(cacheFirst(req, TILES_CACHE));
    return;
  }

  // Everything else under base: cache-first, runtime cache.
  event.respondWith(cacheFirst(req, RUNTIME_CACHE));
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    // Only cache successful, basic (same-origin) responses.
    if (res.ok && res.type === 'basic') {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (e) {
    // Last-resort fallbacks
    const shell = await caches.open(SHELL_CACHE);
    const blank = await shell.match(`${BASE}tiles/blank.png`);
    if (blank && req.destination === 'image') return blank;
    return Response.error();
  }
}
