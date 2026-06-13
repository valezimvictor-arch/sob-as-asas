// Sob as Asas — configuração pública do app (vai no navegador).
// A `anon` key é PÚBLICA por design — o RLS protege os dados. NÃO coloque a
// service_role aqui (essa fica só na Vercel / .env).
window.SAA_CONFIG = {
  url:  'https://tmelqhqleynmplsmqjua.supabase.co',
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZWxxaHFsZXlubXBsc21xanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTU5MTMsImV4cCI6MjA5Njg3MTkxM30.gSf0XRY9Xbjb1DLntgbPA9LFIyZwSwtrrBmqvnAi6MU',
};
