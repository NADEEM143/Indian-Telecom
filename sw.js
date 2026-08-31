const CACHE_NAME = 'it-storefront-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Initialize and bake core assets into local hardware memory storage cleanly
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Force active control interceptors instantly without waiting for app reboots
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Cache-First with Network-Fallback execution pipeline strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
