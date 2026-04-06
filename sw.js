const CACHE_NAME = 'sha-carnet-v3';
const BASE_PATH = '/sha_carnet_pwa';
const SHELL_FILES = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icons/icon-192.png',
  BASE_PATH + '/icons/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        SHELL_FILES.map(function(url) {
          return cache.add(url).catch(function(e) {
            console.warn('[SW] No se pudo cachear:', url);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Ignorar extensiones de Chrome y esquemas no-http
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
  if (url.hostname === 'chrome-extension') return;

  // Apps Script y MP — siempre red
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('mercadopago.com') ||
      url.hostname.includes('mercadolibre.com')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ ok: false, error: 'Sin conexión.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Assets: cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Solo cachear respuestas válidas de nuestro propio origen
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        // No cachear requests de extensiones
        if (event.request.url.startsWith('chrome-extension://')) {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone).catch(function() {
            // Silenciar errores de cache para esquemas no soportados
          });
        });
        return response;
      }).catch(function() {
        if (event.request.destination === 'document') {
          return caches.match(BASE_PATH + '/index.html');
        }
        return new Response('Sin conexión', { status: 503 });
      });
    })
  );
});
