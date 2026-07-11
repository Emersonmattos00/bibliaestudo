// Service Worker básico - sw.js
const CACHE_NAME = 'biblioteca-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/auth.html',
  '/editor.html',
  '/styles.css',
  '/app.js',
  '/auth.js',
  '/editor.js',
  '/assets/capa-padrao.jpg'
];

// Instalação
self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna do cache ou faz fetch da rede
        return response || fetch(event.request);
      }
    )
  );
});

// Ativação
self.addEventListener('activate', event => {
  console.log('Service Worker ativado');
});