// Amile's Drive: keeps the game on the device so it opens with no internet.
// Change VERSION whenever the game changes; the next online launch picks up the new copy.
const VERSION = 'amiles-drive-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve the saved copy straight away (works offline), and refresh it in the background when online.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const fresh = fetch(req)
    .then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(cache => cache.put(req, copy)); }
      return res;
    })
    .catch(() => null);
  event.waitUntil(fresh);
  event.respondWith(
    caches.match(req, { ignoreSearch: true })
      .then(saved => saved || fresh.then(res => res || caches.match('./index.html')))
      .then(res => res || Response.error())
  );
});