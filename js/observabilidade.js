// Observabilidade Sob as Asas
// Carrega Sentry + Plausible CONDICIONALMENTE — só se config.js tiver os IDs.
// Sem segredos no front; o DSN do Sentry e o domínio do Plausible são públicos
// por design (já são valores que ficam expostos no client).

(function(){
  var cfg = window.SAA_CONFIG || {};

  // ── Sentry (erros em produção) ──────────────────────────────────────
  if (cfg.sentryDsn) {
    var s = document.createElement('script');
    s.src = 'https://browser.sentry-cdn.com/8.40.0/bundle.tracing.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = function(){
      if (window.Sentry) {
        try {
          window.Sentry.init({
            dsn: cfg.sentryDsn,
            environment: (location.hostname.indexOf('localhost') >= 0) ? 'dev' : 'production',
            tracesSampleRate: 0.1,            // 10% das sessões com perf trace
            replaysSessionSampleRate: 0,      // não grava sessões por padrão (privacidade)
            replaysOnErrorSampleRate: 0.5,    // 50% das sessões com erro grava replay
            ignoreErrors: [
              'ResizeObserver loop limit exceeded',
              'Non-Error promise rejection captured',
              /^TypeError: Failed to fetch/,  // erros de rede do usuário
            ],
            beforeSend: function(event){
              // Redige PII do payload antes de enviar
              try {
                if (event.request && event.request.url) {
                  event.request.url = event.request.url.replace(/[?&]token=[^&]*/i, '?token=REDACTED');
                  event.request.url = event.request.url.replace(/[?&]code=[^&]*/i, '?code=REDACTED');
                }
              } catch (_) {}
              return event;
            },
          });
        } catch (e) {}
      }
    };
    document.head.appendChild(s);
  }

  // ── Plausible (analytics privacy-first) ─────────────────────────────
  if (cfg.plausibleDomain) {
    var p = document.createElement('script');
    p.defer = true;
    p.setAttribute('data-domain', cfg.plausibleDomain);
    p.src = 'https://plausible.io/js/script.tagged-events.outbound-links.js';
    document.head.appendChild(p);

    // Helper global pra registrar eventos custom (ex: trial_iniciado, anjo_revelado)
    window.plausible = window.plausible || function(){ (window.plausible.q = window.plausible.q || []).push(arguments); };
  }
})();
