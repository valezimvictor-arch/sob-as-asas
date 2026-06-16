# Próxima sprint — itens ainda em aberto

## Item 10 do plano de 4 semanas — Lock Screen Widget iOS

**Status:** fora do escopo desta sprint (requer build nativo Xcode + Capacitor plugin específico).

**O que envolve:**
- Adicionar uma extensão de Widget no projeto iOS (target separado no Xcode)
- Compartilhar dados entre o app principal e o widget via App Group + UserDefaults
- Plugin Capacitor recomendado: `capacitor-widgetsplus` ou implementação custom em Swift
- O widget exibe: "Anjo do dia · Salmo curto"
- Dados atualizados via `WidgetCenter.shared.reloadAllTimelines()` quando o app sincroniza o anjo do dia

**Tempo estimado:** 2–3 dias de trabalho nativo + revisão da App Store (tipo "extensão de produtividade").

**Pré-requisitos para começar:**
1. Build iOS funcionando localmente (Capacitor + Xcode)
2. App ID e provisioning profile configurados na conta Apple Developer da LVSV
3. Decisão de qual dado prioritário aparece: nome do anjo, salmo curto, "velas acesas hoje"

**Alternativa de curto prazo já entregue:** notificação push diária de manhã (`cron-ritual.js?type=morning`) cumpre 80% do valor que o widget entregaria — manter o usuário em contato com seu anjo todo dia.

---

## Outras pendências organizacionais

- 🎤 **Gravação de áudios da Monica** para a Jornada "Conhecer seu anjo em 7 dias" (7 áudios curtos de 1-2 min)
- 🌙 **Áudios para a coleção "Para dormir"** (5 áudios de 15-25 min)
- ✉️ **Primeira edição da Newsletter** publicada no admin antes do próximo sábado
- 💳 **Stripe em produção** — criar os 2 produtos (R$ 19,90 mensal / R$ 149 anual) e configurar webhook
- ⚖️ **Revisão jurídica** dos Termos / Política / Regulamento por advogado de consumo

---

## Tabela `circulos` (opcional, para tracking de convites do Círculo de Oração)

```sql
CREATE TABLE IF NOT EXISTS public.circulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  texto text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.circulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "circulos_owner_insert" ON public.circulos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "circulos_owner_read" ON public.circulos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```
