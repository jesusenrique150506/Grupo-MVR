const CACHE_NAME = 'grupomvr-v2026-09-04-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './D´villa.html',
  './Ravali.html',
  './Marcel.html',
  './Promotoras.html',
  './Admin.html',
  './CSS/opticas-styles.css',
  './js/api.js',
  './manifest.json',
  './mvr.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('SW cache addAll error (offline fallback will still work):', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Peticiones a la API de Google Apps Script van siempre por red
  if (event.request.url.includes('script.google.com') || event.request.url.includes('api.qrserver.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
