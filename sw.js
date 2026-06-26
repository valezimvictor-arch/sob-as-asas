// Sob as Asas — Service Worker — v0.1
// Strategy: network-first para HTML (sempre fresco), cache-first para assets.
// A cada deploy, suba o número da versão (v0.1 → v0.2...) para disparar o
// banner "Nova versão disponível".
const CACHE = 'sobasasas-v0.67';
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

  let _url;
  try { _url = new URL(request.url); } catch (_) { return; }

  // SÓ intercepta same-origin. Requisições cross-origin (CDNs como
  // jsdelivr/unpkg, Supabase, Stripe, fontes) passam DIRETO pro browser.
  // Por quê: o SW não consegue ler respostas opacas cross-origin, e um fetch
  // que falhe aqui virava respondWith(undefined) — foi o que derrubou o
  // supabase-js do jsdelivr e jogou o app inteiro em "modo demo".
  if (_url.origin !== self.location.origin) return;

  // API própria: nunca cachear (dados/auth não podem virar cache stale/PII).
  if (_url.pathname.startsWith('/api/')) return;

  const isHTML = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // network-first; só cai pro cache se a rede falhar E houver cache.
    e.respondWith(
      fetch(request).catch(function(){
        return caches.match(request).then(function(c){ return c || Response.error(); });
      })
    );
  } else {
    // cache-first; se não há cache, vai à rede. Se a rede falhar, NÃO
    // retornamos undefined (deixa rejeitar = erro de rede nativo).
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
        return res;
      }))
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
