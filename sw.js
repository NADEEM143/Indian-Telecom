// 🟢 CHANGED CACHE VALUE: Forces your phone to purge old memory registries instantly
const CACHE_NAME = 'it-storefront-cache-v9'; // Incremented to v9 to discard previous broken cache layers
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Initialize and bake core assets into local hardware memory storage cleanly
self.addEventListener('install', (event) => {
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
  const requestUrl = new URL(event.request.url);

  // 🛑 BYPASS GATEWAY: If the route is an API request, send it straight to the network and exit!
  if (requestUrl.pathname.startsWith('/api') || !event.request.url.startsWith(self.location.origin)) {
    return event.respondWith(fetch(event.request));
  }

  // 🛡️ NATIVE PWA ROOT LOOKUP MATRIX
  // Determine if the incoming route is the naked root or index path string
  const isRootRoute = requestUrl.pathname === '/' || requestUrl.pathname === '/index.html';
  
  // Use the safe request fallback rule or point directly to the cached path string
  const cacheQueryTarget = isRootRoute ? '/index.html' : event.request;
  const backgroundFetchTarget = isRootRoute ? '/index.html' : event.request;

  event.respondWith(
    caches.match(cacheQueryTarget).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch a fresh version in the background to update the cache for next time securely
        fetch(backgroundFetchTarget).then((networkResponse) => {
          if (networkResponse.status === 200) {
            if (networkResponse.redirected) {
              return;
            }
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(backgroundFetchTarget, networkResponse.clone());
            });
          }
        }).catch(() => {});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
