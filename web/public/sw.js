// ============================================================================
// Pino2 -- Service Worker (Ciclo de Vida Agresivo & Fallback Seguro)
// IMPORTANTE: CACHE_VERSION debe coincidir con APP_VERSION en src/lib/version.ts
//             y con el contenido del archivo web/VERSION.
//             Incrementar ambos en cada despliegue con cambios de frontend.
// ============================================================================

const CACHE_VERSION = '1.1.0-mvp';
const CACHE_NAME = 'pino-cache-' + CACHE_VERSION;

// --- INSTALL: Activar inmediatamente sin esperar que se cierren pestañas ---
self.addEventListener('install', function (_event) {
  self.skipWaiting();
});

// --- ACTIVATE: Purgar cachés viejos, tomar control y notificar clientes ---
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function (name) { return name !== CACHE_NAME; })
            .map(function (name) { return caches.delete(name); })
        );
      })
      .then(function () {
        // Tomar control de todas las pestañas abiertas inmediatamente
        return self.clients.claim();
      })
      .then(function () {
        // Notificar a todos los clientes con la versión activa
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
        });
      })
  );
});

// --- MESSAGE: Permite que el cliente fuerce la activación del SW en espera ---
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- FETCH: Estrategias de caché por tipo de recurso ---
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // Excluir peticiones cross-origin (Firebase, Analytics, backend externo, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Excluir llamadas de API y WebSockets — nunca interferir con la red real
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

  // ── Navegaciones SPA (HTML): Network-first ──
  // Siempre intenta red primero para obtener el index.html más reciente.
  // Si la red falla (offline), cae al caché o responde HTML de emergencia.
  if (event.request.mode === 'navigate') {
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
          return caches.match('/index.html').then(function (cached) {
            return cached || new Response('<!DOCTYPE html><html><body><p>Sin conexión</p></body></html>', {
              status: 200,
              headers: { 'Content-Type': 'text/html' },
            });
          });
        })
    );
    return;
  }

  // ── Assets estáticos (/assets/): Cache-first ──
  // Vite genera hashes únicos en cada build → un asset nuevo siempre tiene URL nueva.
  // Es seguro cachear indefinidamente (la URL cambia con cada deploy).
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
        }).catch(function () {
          return new Response('', { status: 404, statusText: 'Asset Not Found' });
        });
      })
    );
    return;
  }

  // ── Resto de peticiones GET: Network-first con fallback a caché ──
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
        return caches.match(event.request).then(function (cached) {
          return cached || new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
  );
});
