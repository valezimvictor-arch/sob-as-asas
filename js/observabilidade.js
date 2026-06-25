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

  // ── Error boundary global ───────────────────────────────────────────
  // Captura erros JS não-tratados e exibe a tela de fallback. Threshold:
  // só mostra após 3 erros em 5s, ou 1 erro "catastrófico" (referência nula
  // em função do core). Ruído conhecido (3rd-party, rede, ResizeObserver) é
  // ignorado pra não cobrir o app com a tela de erro à toa.
  var _errBuf = [];
  // Mensagens benignas que NÃO devem contar pro boundary nem mostrar fallback.
  var _ERROS_BENIGNOS = /ResizeObserver loop|Non-Error promise rejection|Failed to fetch|NetworkError|Load failed|\baborted\b|^Script error\.?$/i;
  function _ehErroCritico(msg){
    if(!msg) return false;
    var m = String(msg).toLowerCase();
    return /cannot read prop|undefined is not a func|null is not an obj|syntaxerror|out of memory/.test(m);
  }
  function _mostrarFallback(detalhe){
    try{
      var el = document.getElementById('err-fallback');
      if(!el) return; // sem o elemento, deixa silencioso
      if(el.style.display === 'flex') return; // já visível
      el.style.display = 'flex';
      var d = document.getElementById('err-detalhe');
      if(d && detalhe){
        // só mostra detalhe em dev — produção fica em branco (anti-vazamento)
        var dev = location.hostname.indexOf('localhost') >= 0 || location.hostname.indexOf('127.0.0.1') >= 0;
        d.textContent = dev ? detalhe : '';
      }
    }catch(_){}
  }
  function _registrarErro(msg, source){
    if(!msg) return;
    if(_ERROS_BENIGNOS.test(String(msg))) return; // ruído conhecido — ignora
    var agora = Date.now();
    _errBuf = _errBuf.filter(function(t){ return agora - t < 5000; });
    _errBuf.push(agora);
    if(_ehErroCritico(msg) || _errBuf.length >= 3){
      _mostrarFallback(msg + (source ? ' · '+source : ''));
    }
  }
  window.addEventListener('error', function(e){
    if(e && e.error){ _registrarErro(e.message, e.filename ? (e.filename.split('/').pop()+':'+e.lineno) : ''); }
  });
  window.addEventListener('unhandledrejection', function(e){
    var reason = (e && e.reason) || {};
    var msg = reason.message || String(reason);
    // Promises de fetch falhando não devem mostrar fallback (rede do usuário)
    if(/Failed to fetch|NetworkError|aborted/i.test(msg)) return;
    _registrarErro(msg, 'promise');
  });
  // Helper pra manual reporting (ex.: em catch blocks)
  window.saaReportErr = function(err, contexto){
    var msg = (err && err.message) || String(err);
    if(window.Sentry && window.Sentry.captureException){
      try{ window.Sentry.captureException(err, { tags: { contexto: contexto || 'manual' } }); }catch(_){}
    }
    _registrarErro(msg, contexto);
  };

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
