var dataCacheName = 'bebenemeData-v1.01';
var cacheName = 'bebenemePWA-step-1';
var filesToCache = [
  '/scripts/app.js',
  '/scripts/alea.min.js',
  '/styles/inline.css',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/images/editing.svg',
  '/images/save.svg',
  '/images/cloud-reload-2.svg',
];

var SEX = ['MALE', 'FEMALE'];
for (var s in SEX) {
  for (var i = 0 ; i < 26 ; ++i) {
    filesToCache.push('/data/' + SEX[s] + '-' + String.fromCharCode('a'.charCodeAt(0) + i) + '.txt');
  }
}

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName)
    .then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      // / may redirect, so cache separately.
      fetch('/').then(function(response) {
        if (response.status == 200)
          cache.put('/', new Response(response.body));
      });
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Fixes a corner case in which the app wasn't returning the latest data.
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);
  var dataUrl = 'https://external.example.com/v1/public/yql';
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * bebeneme data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});
