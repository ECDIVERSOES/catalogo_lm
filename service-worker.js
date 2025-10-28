const CACHE_NAME = 'karaoke-cache-v01'; // Altere a versão para forçar atualização
const ASSETS = [
  './',
  './index.html',
  './nova_tela.html',
  './detalhes.html',
  './vendas.html',
  './favoritos.html',
  './styles.css',
  './script.js',
  './songs.json',
  './manifest.json',
  './icon-192x192.png',
  './icon-310x310.png',
  './favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto:', CACHE_NAME);
        return Promise.all(
          ASSETS.map(asset => {
            let url = asset + '?v=' + new Date().getTime(); // Corrigida a interpolação
            return fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error('Erro ao buscar ' + url + ': ' + response.status); // Corrigida a interpolação
                }
                return cache.put(asset, response);
              })
              .catch(error => {
                console.error('[SW] Falha ao armazenar ' + asset + ':', error); // Corrigida a interpolação
              });
          })
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});