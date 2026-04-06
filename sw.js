// ============================================================
//  SHA Carnet — Service Worker
//  Estrategia: Cache-first para assets, Network-first para API
// ============================================================

const CACHE_NAME = 'sha-carnet-v1';
const CACHE_VERSION = '1.0.0';

// Archivos que se cachean al instalar (shell de la app)
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── INSTALL: precachear el shell ──────────────────────────────
self.addEventListener('install', function(event) {
  console.log('[SW] Instalando v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Cacheando shell de la app');
        // addAll falla si algún archivo no existe — usamos add individual
        return Promise.allSettled(
          SHELL_FILES.map(function(url) {
            return cache.add(url).catch(function(err) {
              console.warn('[SW] No se pudo cachear:', url, err);
            });
          })
        );
      })
      .then(function() {
        // Activar inmediatamente sin esperar que se cierren las tabs viejas
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE: limpiar caches viejas ──────────────────────────
self.addEventListener('activate', function(event) {
  console.log('[SW] Activando v' + CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) { return name !== CACHE_NAME; })
            .map(function(name) {
              console.log('[SW] Eliminando cache vieja:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        // Tomar control de todas las tabs abiertas inmediatamente
        return self.clients.claim();
      })
  );
});

// ── FETCH: estrategia por tipo de request ────────────────────
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // 1. Requests al backend de Apps Script → Network only (nunca cachear datos)
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ ok: false, error: 'Sin conexión. Revisá tu internet e intentá de nuevo.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 2. Requests a Mercado Pago → Network only
  if (url.hostname.includes('mercadopago.com') || url.hostname.includes('mercadolibre.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Assets de la app → Cache first, network fallback
  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        if (cachedResponse) {
          // Actualizar en background (stale-while-revalidate)
          var networkFetch = fetch(event.request).then(function(networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              var responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          }).catch(function() { /* sin conexión, usamos cache */ });

          return cachedResponse;
        }

        // No está en cache → buscar en red y cachear
        return fetch(event.request)
          .then(function(networkResponse) {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
              return networkResponse;
            }
            var responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          })
          .catch(function() {
            // Sin conexión y sin cache → página offline
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            return new Response('Sin conexión', { status: 503 });
          });
      })
  );
});

// ── PUSH NOTIFICATIONS (base para futuro) ────────────────────
self.addEventListener('push', function(event) {
  if (!event.data) return;

  var data = event.data.json();
  var options = {
    body: data.body || 'Tenés una notificación de SHA Carnet',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'abrir', title: 'Ver ahora' },
      { action: 'cerrar', title: 'Después' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SHA Carnet', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'cerrar') return;

  var urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          if (clientList[i].url === urlToOpen && 'focus' in clientList[i]) {
            return clientList[i].focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});

console.log('[SW] Service Worker SHA Carnet v' + CACHE_VERSION + ' cargado');
