// 🟢 CHANGED CACHE VALUE: Forces your phone to purge old memory registries instantly
const CACHE_NAME = 'it-storefront-cache-v4'; // Incremented version to clear previous bad state
const ASSETS_TO_CACHE = [
  '/',                // Root path configuration
  '/index.html',      // Fallback target path string
  '/manifest.json'    // App manifest file validation
];

// Initialize and bake core assets into local hardware memory storage cleanly
self.addEventListener('install', (event) => {
  // Forces the waiting new service worker to become the active service worker instantly
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch blocks to prevent failed installation tasks if single assets time out
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.error("Precaching assets failed:", err));
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

  // 🛡️ DYNAMIC ROOT ROUTING FALLBACK
  // If the browser opens from cold storage asking for "/" or "/index.html", evaluate the cache shell match directly
  let targetRequest = event.request;
  if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
    targetRequest = new Request('/index.html');
  }

  event.respondWith(
    caches.match(targetRequest).then((cachedResponse) => {
      // 1. If it exists in local storage cache, return it immediately to prevent screen lockouts
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        
        return cachedResponse;
      }

      // 2. Otherwise fetch directly from server channel pipelines
      return fetch(event.request).catch(() => {
        // Ultimate backup: If network fails and match fails, try pulling the raw file cache string
        return caches.match('/index.html');
      });
    })
  );
});
