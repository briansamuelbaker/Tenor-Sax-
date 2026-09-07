const VERSION = 'v2';
const STATIC_CACHE = `tenor-sax-static-${VERSION}`;
const SHELL_CACHE = `tenor-sax-shell-${VERSION}`;

const PRECACHE = [
  './tenor-sax-beginner.html',
  './index.html',
  './manifest.json',
  './sax-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== SHELL_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isHTML(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html') ||
    request.url.endsWith('.html');
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request) || await caches.match('./tenor-sax-beginner.html');
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(isHTML(request) ? networkFirst(request) : cacheFirst(request));
});
