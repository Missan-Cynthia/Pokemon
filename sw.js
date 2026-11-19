const cacheName = 'pokemon-practice-pwa-v1';
const scope = new URL(self.registration.scope);
const home = new URL('./', scope).href;
const core = ['./', 'pokemon-data.js', 'pokemon-zhuyin.js', 'manifest.webmanifest',
  'favicon-v2.ico', 'icon-v2.png', 'pwa-192.png', 'pwa-512.png'];
const coreUrls = new Set(core.map(file => new URL(file, scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(
    [...coreUrls].map(url => new Request(url, { cache: 'reload' })),
  )));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('pokemon-practice-pwa-') && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function load(request, key, preferCache) {
  const cache = await caches.open(cacheName);
  if (preferCache) {
    const saved = await cache.match(key);
    if (saved) return saved;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      try { await cache.put(key, response.clone()); } catch {}
    } else if (response.status >= 500) {
      return await cache.match(key) || response;
    }
    return response;
  } catch {
    return await cache.match(key) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const localPath = url.pathname.slice(scope.pathname.length);
  const isHome = request.mode === 'navigate' && (localPath === '' || localPath === 'index.html');
  const isArtwork = /^pokemon-web\/\d{4}\.webp$/.test(localPath);
  if (!isHome && !isArtwork && !coreUrls.has(url.href)) return;
  event.respondWith(load(request, isHome ? home : url.href, isArtwork));
});
