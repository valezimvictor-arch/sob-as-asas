// Sob as Asas — configuração pública do app (vai no navegador).
// A `anon` key é PÚBLICA por design — o RLS protege os dados. NÃO coloque a
// service_role aqui (essa fica só na Vercel / .env).
window.SAA_CONFIG = {
  url:  'https://tmelqhqleynmplsmqjua.supabase.co',
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZWxxaHFsZXlubXBsc21xanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTU5MTMsImV4cCI6MjA5Njg3MTkxM30.gSf0XRY9Xbjb1DLntgbPA9LFIyZwSwtrrBmqvnAi6MU',
  // VAPID PUBLIC key (push) — a private fica na Vercel (VAPID_PRIVATE_KEY)
  vapidPublic: 'BMjfmsj7ToubD8KPb_uuEo19w3jidgzomoMY9txih0H9_nejOmtDYswqG_J16T3MIFsKBHj8rWya-esXXPFtjTA',

  // Observabilidade (opcional — só carrega se preenchido)
  // Sentry: erros em produção · https://sentry.io
  sentryDsn: 'https://ea6a8dbb77f05f01a1a08fc0a527c4a4@o4511598638923776.ingest.us.sentry.io/4511598642593792',

  // Plausible: analytics privacy-first · https://plausible.io
  plausibleDomain: 'sobasasas.com.br',
};
