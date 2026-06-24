// Sob as Asas — Service Worker — v0.1
// Strategy: network-first para HTML (sempre fresco), cache-first para assets.
// A cada deploy, suba o número da versão (v0.1 → v0.2...) para disparar o
// banner "Nova versão disponível".
const CACHE = 'sobasasas-v0.47';
const ASSETS = ['/manifest.json', '/asa-icon.svg', '/js/geradorTextos.js', '/js/observabilidade.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const isHTML = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
  } else {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => cached))
    );
  }
});

// Push de notificações (ritual diário, milagre do mês)
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {}
  const title = data.title || 'Sob as Asas';
  const options = {
    body: data.body || 'Seu anjo tem uma mensagem para você.',
    icon: '/asa-icon.svg',
    badge: '/asa-icon.svg',
    data: { url: data.url || '/' },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.openWindow(url));
});
