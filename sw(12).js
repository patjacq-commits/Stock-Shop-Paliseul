// Service Worker — Stock Shop Paliseul
// Stratégie Network First : on prend toujours la dernière version en ligne,
// le cache ne sert que hors connexion. Incrémenter VERSION à chaque livraison.
const VERSION = 'v0.2.1';
const CACHE = 'stock-shop-' + VERSION;
const FICHIERS = ['./', './index.html', './manifest.json', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(k => k.startsWith('stock-shop-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase (données, connexion) et Open Food Facts gèrent eux-mêmes le réseau
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('firebaseapp.com') || url.hostname.includes('openfoodfacts')) return;
  const ok = url.origin === self.location.origin || url.hostname === 'www.gstatic.com';
  if (!ok) return;

  e.respondWith(
    fetch(req)
      .then(rep => {
        if (rep && (rep.ok || rep.type === 'opaque')) {
          const copie = rep.clone();
          caches.open(CACHE).then(c => c.put(req, copie));
        }
        return rep;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
