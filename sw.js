// 🟢 CHANGED CACHE VALUE: Forces your phone to purge old memory registries instantly
const CACHE_NAME = 'it-storefront-cache-v5'; // Incremented version to clear previous bad state
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Initialize and bake core assets into local hardware memory storage cleanly
self.addEventListener('install', (event) => {
  // Forces the waiting new service worker to become the active service worker instantly
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Force active control interceptors instantly without waiting for app reboots
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing ancient ghost memory strings... 🗑️');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-First with Network-Fallback execution pipeline strategy
self.addEventListener('fetch', (event) => {
  // Create a URL object to cleanly parse incoming web path domains
  const requestUrl = new URL(event.request.url);

  // 🛑 BYPASS GATEWAY: If the route is an API request, send it straight to the network and exit!
  if (requestUrl.pathname.startsWith('/api') || !event.request.url.startsWith(self.location.origin)) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch a fresh version in the background to update the cache for next time
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            // SAFE CHECK: If Vercel returns a redirect response, do not try to put it in cache
            if (networkResponse.redirected) {
              return;
            }
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
