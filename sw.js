// Shop app service worker: always tries the internet first (so updates show
// straight away), and falls back to the last saved copy when offline.
const CACHE = 'shop-app-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    // 'no-cache' = always ask the website for the newest version (it skips
    // the phone's 10-minute copy), so every update shows on the next open.
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => (res.redirected ? fetch(req) : res))
      .then((res) => {
      if (res && res.ok){ const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match(req, { ignoreSearch: true })))
  );
});
