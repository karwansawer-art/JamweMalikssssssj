const CACHE_NAME = 'recovery-app-v1';
const STATIC_CACHE_NAME = 'recovery-app-static-v1';

const urlsToCacheOnInstall = [
  './',
  './index.html',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCacheOnInstall))
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || 
      request.url.includes('firestore.googleapis.com') ||
      request.url.includes('generativelanguage.googleapis.com')) {
    // Let the network handle it.
    return;
  }
  
  const url = new URL(request.url);

  // Cache-first for static assets (from CDNs, fonts, images, etc.)
  if (url.hostname !== self.location.hostname || /\.(js|css|woff2|png|jpg|jpeg|gif|svg)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          return response || fetch(request).then(networkResponse => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  } else {
    // Network-first for app pages and local files
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(response => {
            // If network fails, and we have it in cache, serve it.
            // If not in cache either, the browser will show the offline page.
            return response;
          });
        })
    );
  }
});
