// 🟢 CHANGED CACHE VALUE: Forces your phone to purge old memory registries instantly
const CACHE_NAME = 'it-storefront-cache-v18'; // Incremented version to completely dump past bad cache registries
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

// Hybrid Network-First (for HTML routing keys) + Cache-First (static files) Architecture Pipeline
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 🛑 BYPASS GATEWAY: If the route is an API request or cross-origin link, send it straight to the network!
  if (requestUrl.pathname.startsWith('/api') || !event.request.url.startsWith(self.location.origin)) {
    return event.respondWith(fetch(event.request));
  }

  // Identify HTML framework entry points cleanly
  const isHtmlNavigationRoute = requestUrl.pathname === '/' || requestUrl.pathname === '/index.html' || requestUrl.pathname.endsWith('.html');

  if (isHtmlNavigationRoute) {
    // 🚀 STRATEGY: Network-First for main routing paths to completely prevent Vercel blank refresh crashes
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200 && !networkResponse.redirected) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseClone); // Save fresh version into index placeholder entry
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback path: if network drops, pull from your offline local cache structure safely
          return caches.match('/index.html');
        })
    );
  } else {
    // 🛡️ STRATEGY: Cache-First for assets (manifests, png icons, background scripts)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200 && !networkResponse.redirected) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
