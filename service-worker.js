const CACHE_NAME = 'karaoke-cache-v32'; // Altere a versão para forçar atualização
const ASSETS = [
  './',
  './index.html',
  './nova_tela.html',
  './favoritos.html',
  './styles.css',
  './script.js',
  './songs.json',
  './manifest.json',
  './detalhes.html',
  './offline.html',
  './icon-192x192.png',
  './icon-310x310.png',
  './favicon.ico',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto:', CACHE_NAME);
        return cache.addAll(ASSETS); // Armazena os recursos no cache
      })
  );
  self.skipWaiting(); // Força o Service Worker a se tornar ativo imediatamente
});

// Intercepta as solicitações de rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request) // Tenta servir do cache primeiro
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Se o recurso estiver no cache, retorna ele
          return cachedResponse;
        }

        // Se não estiver no cache, busca da rede
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              // Armazena a resposta da rede no cache para uso futuro
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return networkResponse; // Retorna a resposta da rede
          })
          .catch(() => {
            // Se a rede falhar, retorna a página offline.html
            return caches.match('./offline.html');
          });
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Exclui caches antigos
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume o controle de todas as páginas imediatamente
});
