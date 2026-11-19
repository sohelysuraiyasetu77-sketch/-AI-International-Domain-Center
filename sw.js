const CACHE_NAME = 'aidc-public-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './phase6-studio.html',
  './manifest.json',
  './icon.svg'
];
const PUBLIC_DOCUMENTS = new Set([
  new URL('./', self.location.href).pathname,
  new URL('./index.html', self.location.href).pathname,
  new URL('./phase6-studio.html', self.location.href).pathname,
  new URL('./manifest.json', self.location.href).pathname,
  new URL('./icon.svg', self.location.href).pathname
]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('aidc-public-shell-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache APIs, admin paths, authentication/session data, or arbitrary customer content.
  if (/\/api(?:\/|$)/i.test(url.pathname) || /admin-panel|login|account|dashboard/i.test(url.pathname)) return;
  if (!PUBLIC_DOCUMENTS.has(url.pathname)) return;

  event.respondWith(
    fetch(request, { cache: 'no-store' }).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
