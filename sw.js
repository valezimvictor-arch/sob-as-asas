// Sob as Asas — Service Worker — v0.1
// Strategy: network-first para HTML (sempre fresco), cache-first para assets.
// A cada deploy, suba o número da versão (v0.1 → v0.2...) para disparar o
// banner "Nova versão disponível".
const CACHE = 'sobasasas-v0.60';
const ASSETS = ['/manifest.json', '/asa-icon.svg', '/js/geradorTextos.js', '/js/observabilidade.js'];
// Scripts de terceiros que o app depende em runtime — pré-cacheados de forma
// best-effort (não bloqueia o install se algum falhar). Garante que recovery /
// paywall / login continuam funcionando offline ou em rede ruim.
const ASSETS_BEST_EFFORT = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Assets críticos: bloqueia install se falhar (sinaliza que algo grave aconteceu)
      const critico = c.addAll(ASSETS);
      // Best-effort: tenta cachear cada um, mas não bloqueia
      const opcional = Promise.allSettled(
        ASSETS_BEST_EFFORT.map(url =>
          fetch(url, { mode: 'cors' }).then(r => r.ok ? c.put(url, r) : null).catch(() => null)
        )
      );
      return Promise.all([critico, opcional]);
    })
  );
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

  // NUNCA cachear chamadas de dados/auth: API própria (/api/*) e Supabase.
  // Respostas autenticadas não podem persistir no CacheStorage (vazam PII num
  // device compartilhado e sobrevivem ao logout) nem ser reservidas de forma
  // stale e independente do token. Só assets estáticos entram no cache.
  let _url;
  try { _url = new URL(request.url); } catch (_) { _url = null; }
  if (_url && (_url.pathname.startsWith('/api/') || _url.hostname.endsWith('.supabase.co'))) {
    return; // deixa o browser ir direto à rede, sem SW no meio
  }

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
