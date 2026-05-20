// ============================================================
// SERVICE WORKER - PWA Ordini Colazione Hotel
// ============================================================

const CACHE_NAME = 'ordini-colazione-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/products.js',
  '/firebase-config.js',
  '/manifest.json'
];

// ============================================================
// INSTALLAZIONE - Cache dei file essenziali
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installazione in corso...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aperta, salvataggio assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Assets salvati in cache');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Errore durante installazione:', error);
      })
  );
});

// ============================================================
// ATTIVAZIONE - Pulizia vecchie cache
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Attivazione in corso...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Rimozione vecchia cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Attivato e pronto');
        return self.clients.claim();
      })
  );
});

// ============================================================
// FETCH - Strategia Cache First, Network Fallback
// ============================================================
self.addEventListener('fetch', (event) => {
  // Ignora richieste non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignora richieste Firebase (devono sempre andare in rete)
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Trovato in cache, restituisci
          return cachedResponse;
        }

        // Non in cache, prova dalla rete
        return fetch(event.request)
          .then((networkResponse) => {
            // Se la risposta è valida, salvala in cache
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline e non in cache - mostra pagina offline se disponibile
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// ============================================================
// MESSAGGI - Comunicazione con l'app
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
