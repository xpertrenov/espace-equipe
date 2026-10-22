/* Service worker de l'Espace Équipe : garde l'application sur l'appareil pour qu'elle s'ouvre sans réseau. */
var VERSION = '7b10807771';
var COQUILLE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png', './icon-maskable-512.png'];
var EXTERNES = ['https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open('coquille-' + VERSION).then(function (c) {
    return c.addAll(COQUILLE).then(function () { return Promise.all(EXTERNES.map(function (u) { return fetch(u, { mode: 'no-cors' }).then(function (r) { return c.put(u, r); }).catch(function () {}); })); });
  }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^coquille-/.test(k) && k !== 'coquille-' + VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data === 'activer') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                   // appels au serveur : jamais mis en cache ici
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return;
  if (req.mode === 'navigate') {                                      // la page : celle de l'appareil d'abord
    e.respondWith(caches.match('./index.html').then(function (r) { return r || fetch(req); }));
    return;
  }
  var externe = url.origin !== self.location.origin;
  if (externe && !/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) return;
  e.respondWith(caches.open(externe ? 'externes' : 'coquille-' + VERSION).then(function (c) {
    return c.match(req).then(function (r) {
      var reseau = fetch(req).then(function (n) { if (n && (n.ok || n.type === 'opaque')) c.put(req, n.clone()); return n; }).catch(function () { return r; });
      return r || reseau;
    });
  }));
});
