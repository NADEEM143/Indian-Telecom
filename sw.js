// 🟢 CHANGED CACHE VALUE: Forces your phone to purge old memory registries instantly
const CACHE_NAME = 'it-storefront-cache-v12'; // Incremented version to completely dump past bad cache registries
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

  // 🛡️ SAFE METADATA MAPS: Map naked directory structures back onto physical request signatures cleanly
  const isRootPath = requestUrl.pathname === '/' || requestUrl.pathname === '/index.html';
  const cacheQueryKey = isRootPath ? '/index.html' : event.request;

  event.respondWith(
    caches.match(cacheQueryKey).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch a fresh version in the background to update the cache safely
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            // 🛑 CRITICAL FIXED LAYER: If Vercel redirects the clean URL request, stop immediately!
            // This prevents the redirect security error from ever crashing your script pipeline.
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
