// ============================================================================
// Pino2 -- Service Worker (Ciclo de Vida Agresivo)
// ============================================================================

const CACHE_VERSION = '1.1.0-mvp';
const CACHE_NAME = 'pino-cache-b' + CACHE_VERSION;

// --- INSTALL ---
self.addEventListener('install', function (_event) {
  self.skipWaiting();
});

// --- ACTIVATE ---
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      return self.clients.matchAll({ type: 'window' });
    }).then(function (clients) {
      clients.forEach(function (client) {
        client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_NAME });
      });
    })
  );
});

// --- FETCH ---
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.includes('/api-dev') ||
    event.request.url.includes('socket.io')
  ) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function (networkResponse) {
          var clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
          return networkResponse;
        })
        .catch(function () {
          return caches.match(event.request).then(function (cached) {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then(function (networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            var clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      })
      .catch(function () {
        return caches.match(event.request);
      })
  );
});
