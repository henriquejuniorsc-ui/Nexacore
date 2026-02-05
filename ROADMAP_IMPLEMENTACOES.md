# 🚀 NEXACORE — ROADMAP DE IMPLEMENTAÇÕES
## Elevação de 7.6/10 → 9.5/10

---

## 📊 VISÃO GERAL

| Fase | Foco | Duração | Impacto na Nota |
|------|------|---------|-----------------|
| **BLOCO 1** | Component Library Base | 1-2 semanas | +0.5 |
| **BLOCO 2** | Microinterações & Delight | 1 semana | +0.4 |
| **BLOCO 3** | Landing Page Premium | 1-2 semanas | +0.4 |
| **BLOCO 4** | Dashboard Evolution | 1-2 semanas | +0.5 |
| **BLOCO 5** | Onboarding & Polish | 1 semana | +0.3 |

**Meta Final:** Transformar o NexaCore de "tecnicamente sólido" para "experiência excepcional"

---

## 🔵 BLOCO 1: COMPONENT LIBRARY BASE
### Objetivo: Eliminar repetição e criar Single Source of Truth

**Problema Atual:** Botões, inputs, cards repetidos inline em 100+ arquivos, gerando inconsistência e manutenção difícil.

### 1.1 Button Component
**Arquivo:** `/src/components/ui/button.tsx`

| Variante | Uso | Características |
|----------|-----|-----------------|
| `primary` | CTAs principais | Amarelo (#FFC300), glow hover |
| `secondary` | Ações secundárias | Glass effect, border sutil |
| `ghost` | Ações terciárias | Transparente, hover suave |
| `danger` | Ações destrutivas | Vermelho com confirmação |
| `brand` | Marketing/Landing | Gradiente rosa→laranja |

**Features:**
- [ ] Loading state com spinner
- [ ] Disabled state visual
- [ ] Size variants (sm, md, lg)
- [ ] Icon support (left/right)
- [ ] Framer Motion hover/tap
- [ ] Keyboard focus ring

---

### 1.2 Input Component
**Arquivo:** `/src/components/ui/input.tsx`

| Tipo | Features |
|------|----------|
| `text` | Placeholder animado, clear button |
| `password` | Toggle visibility |
| `search` | Ícone, debounce integrado |
| `textarea` | Auto-resize |

**Features:**
- [ ] Validação inline (success/error states)
- [ ] Character counter
- [ ] Helper text slot
- [ ] Label animado (float label)
- [ ] Focus ring consistente

---

### 1.3 Card Component
**Arquivo:** `/src/components/ui/card.tsx`

| Variante | Uso |
|----------|-----|
| `default` | Container básico |
| `glass` | Glassmorphism com blur |
| `elevated` | Shadow para destaque |
| `interactive` | Hover lift effect |
| `gradient` | Border gradient brand |

**Features:**
- [ ] Header/Body/Footer slots
- [ ] Collapsible option
- [ ] Loading skeleton state
- [ ] Hover animations

---

### 1.4 Badge Component
**Arquivo:** `/src/components/ui/badge.tsx`

| Status | Cor | Uso |
|--------|-----|-----|
| `success` | Verde | Confirmações |
| `warning` | Amarelo | Alertas |
| `error` | Vermelho | Erros |
| `info` | Azul | Informações |
| `neutral` | Cinza | Default |
| `hot` | Laranja | Lead quente |
| `warm` | Amarelo | Lead morno |
| `cold` | Azul | Lead frio |

---

### 1.5 Stat Card Component
**Arquivo:** `/src/components/ui/stat-card.tsx`

**Features:**
- [ ] useCountUp integrado (números animados)
- [ ] Sparkline opcional (mini gráfico)
- [ ] Trend indicator (↑ verde / ↓ vermelho)
- [ ] Icon slot com background gradient
- [ ] Skeleton loading state

---

### 1.6 Dialog/Modal Component
**Arquivo:** `/src/components/ui/dialog.tsx`

**Features:**
- [ ] AnimatePresence para enter/exit
- [ ] Backdrop blur
- [ ] Close on escape/click outside
- [ ] Size variants (sm, md, lg, xl)
- [ ] Prevent scroll body

---

### 1.7 Toast/Notification Component
**Arquivo:** `/src/components/ui/toast.tsx`

| Tipo | Animação |
|------|----------|
| `success` | Slide in + checkmark animado |
| `error` | Shake + X animado |
| `warning` | Pulse |
| `info` | Fade in |

**Features:**
- [ ] Auto dismiss (configurável)
- [ ] Stack de múltiplos toasts
- [ ] Action button opcional
- [ ] Progress bar de dismiss

---

### 1.8 Command Palette (Cmd+K)
**Arquivo:** `/src/components/ui/command.tsx`

**Features:**
- [ ] Integrar com cmdk library
- [ ] Busca global (páginas, clientes, ações)
- [ ] Atalhos de teclado
- [ ] Recent searches
- [ ] Categorias com ícones

---

### 1.9 Tooltip Component
**Arquivo:** `/src/components/ui/tooltip.tsx`

**Features:**
- [ ] Radix UI base
- [ ] Delay customizável
- [ ] Posições (top, right, bottom, left)
- [ ] Arrow pointer
- [ ] Rich content support

---

### 1.10 Skeleton Component
**Arquivo:** `/src/components/ui/skeleton.tsx`

**Variantes:**
- [ ] Text (linhas)
- [ ] Avatar (círculo)
- [ ] Card (retângulo)
- [ ] Table row
- [ ] Stat card
- [ ] Custom (aceitar className)

---

### Checklist BLOCO 1
- [ ] Criar `/src/components/ui/button.tsx`
- [ ] Criar `/src/components/ui/input.tsx`
- [ ] Criar `/src/components/ui/card.tsx`
- [ ] Criar `/src/components/ui/badge.tsx`
- [ ] Criar `/src/components/ui/stat-card.tsx`
- [ ] Criar `/src/components/ui/dialog.tsx`
- [ ] Criar `/src/components/ui/toast.tsx`
- [ ] Criar `/src/components/ui/command.tsx`
- [ ] Criar `/src/components/ui/tooltip.tsx`
- [ ] Criar `/src/components/ui/skeleton.tsx`
- [ ] Atualizar `/src/components/ui/index.tsx` com exports
- [ ] Refatorar Dashboard para usar novos componentes
- [ ] Refatorar Inbox para usar novos componentes

**Estimativa:** 40h | **Prioridade:** P0 (Crítico)

---

## 🟢 BLOCO 2: MICROINTERAÇÕES & DELIGHT
### Objetivo: Utilizar Framer Motion ao máximo e criar "wow moments"

### 2.1 Números Animados nos Stat Cards
**Onde:** Dashboard principal

```tsx
// Usar o hook useCountUp existente em motion.tsx
const count = useCountUp(appointments, 600, isInView);
```

**Tasks:**
- [ ] Aplicar useCountUp em "Agendamentos Hoje"
- [ ] Aplicar useCountUp em "Novos Clientes"
- [ ] Aplicar useCountUp em "Faturamento do Mês"
- [ ] Aplicar useCountUp em "Taxa de Conversão"

---

### 2.2 Hover Effects Dramáticos
**Onde:** Cards, botões, itens de lista

| Elemento | Efeito |
|----------|--------|
| Cards | Scale 1.02 + shadow lift |
| Botão CTA | Glow + scale |
| Sidebar items | Slide indicator |
| Table rows | Background highlight |

---

### 2.3 Success Animations
**Criar:** `/src/components/ui/success-animation.tsx`

**Features:**
- [ ] Checkmark animado (SVG path animation)
- [ ] Confetti para achievements importantes
- [ ] Pulse ring para confirmações

---

### 2.4 Empty States Emocionais
**Onde:** Todas as páginas sem dados

**Melhorias:**
- [ ] Ilustrações customizadas (ou Lottie)
- [ ] Copy emocional e personalizado
- [ ] CTA contextual ("Crie seu primeiro...")
- [ ] Animação de entrada

---

### 2.5 Loading States Premium
**Criar:** Skeleton screens em todas as páginas

**Pages:**
- [ ] Dashboard skeleton
- [ ] Inbox skeleton
- [ ] Clients skeleton
- [ ] Appointments skeleton

---

### 2.6 Pull-to-Refresh (Mobile)
**Onde:** Listas principais no mobile

---

### Checklist BLOCO 2
- [ ] Implementar useCountUp nos stat cards do dashboard
- [ ] Adicionar hover effects dramáticos nos cards
- [ ] Criar success animation component
- [ ] Redesenhar todos os empty states
- [ ] Implementar skeleton screens
- [ ] Adicionar stagger animations em listas
- [ ] Testar prefers-reduced-motion

**Estimativa:** 32h | **Prioridade:** P0 (Crítico)

---

## 🟡 BLOCO 3: LANDING PAGE PREMIUM
### Objetivo: Converter visitantes com "wow factor"

### 3.1 Hero Section Reimaginada
**Arquivo:** `/src/app/page.tsx` (Hero section)

**Melhorias:**
- [ ] Staggered entrance animation (título → descrição → CTAs)
- [ ] Background com gradient mesh animado
- [ ] Particles sutis ou noise texture
- [ ] Badge "Novo" com animação pulse

---

### 3.2 Product Mockup Interativo
**Substituir imagem estática por:**
- [ ] Mockup com hover highlights
- [ ] Tooltips mostrando features
- [ ] Animação de dados atualizando
- [ ] Cursor customizado no hover

---

### 3.3 Features Section
**Melhorias:**
- [ ] Cards com entrada staggered
- [ ] Ícones animados no hover
- [ ] Gradient accent nas bordas
- [ ] Expandable details

---

### 3.4 "Como Funciona" Animado
**Criar:** Seção com 3 steps animados

**Features:**
- [ ] Número do step com count animation
- [ ] Linha conectando os steps (SVG animated)
- [ ] Icons que animam ao scroll
- [ ] Mockups contextuais

---

### 3.5 Testimonials Premium
**Melhorias:**
- [ ] Fotos reais (ou avatares ilustrados de qualidade)
- [ ] Rating com estrelas animadas
- [ ] Quote com aspas decorativas grandes
- [ ] Carousel com auto-play

---

### 3.6 Pricing com Destaque
**Melhorias:**
- [ ] Badge "Mais Popular" ou "Recomendado"
- [ ] Hover effect com glow
- [ ] Toggle mensal/anual com economia destacada
- [ ] Checkmarks animados nos features

---

### 3.7 Social Proof Live
**Criar:** Contador de usuários/clínicas

```tsx
// Exemplo
<div className="flex items-center gap-2">
  <AnimatedNumber value={523} /> clínicas confiam no NexaCore
</div>
```

---

### 3.8 CTA Final Impactante
**Melhorias:**
- [ ] Background com gradient hero
- [ ] Texto maior, mais urgente
- [ ] Trust badges (LGPD, Segurança)
- [ ] Animação de entrada ao scroll

---

### 3.9 Footer Completo
**Melhorias:**
- [ ] Newsletter signup com feedback
- [ ] Links organizados por categoria
- [ ] Social icons com hover
- [ ] Copyright com ano dinâmico

---

### Checklist BLOCO 3
- [ ] Refatorar Hero com animações de entrada
- [ ] Criar background animado (gradient mesh/particles)
- [ ] Tornar mockup interativo
- [ ] Redesenhar Features cards
- [ ] Criar seção "Como Funciona" animada
- [ ] Atualizar Testimonials com fotos/carousel
- [ ] Adicionar destaque no Pricing
- [ ] Implementar contador de social proof
- [ ] Redesenhar CTA final
- [ ] Completar Footer

**Estimativa:** 48h | **Prioridade:** P1 (Importante)

---

## 🟠 BLOCO 4: DASHBOARD EVOLUTION
### Objetivo: Visualização de dados e insights acionáveis

### 4.1 Revenue Chart
**Criar:** `/src/components/dashboard/revenue-chart.tsx`

**Features:**
- [ ] Line/Area chart com Recharts
- [ ] Tooltip customizado
- [ ] Período selecionável (7d, 30d, 90d)
- [ ] Comparação com período anterior
- [ ] Loading skeleton

---

### 4.2 Sparklines nos Stat Cards
**Adicionar ao stat-card.tsx:**

**Features:**
- [ ] Mini gráfico de 7 dias
- [ ] Cor baseada na tendência
- [ ] Hover para ver valor

---

### 4.3 Appointment Heatmap
**Criar:** Calendário visual de agendamentos

**Features:**
- [ ] Cores por densidade
- [ ] Tooltip com detalhes
- [ ] Click para ver dia
- [ ] Visão semanal/mensal

---

### 4.4 AI Assistant Widget
**Criar:** `/src/components/dashboard/ai-widget.tsx`

**Features:**
- [ ] Floating widget (canto inferior direito)
- [ ] Preview de sugestões do AI
- [ ] Quick actions (responder, agendar)
- [ ] Badge com contagem de sugestões

---

### 4.5 Quick Actions Contextuais
**Melhorias:**
- [ ] Baseado no horário/dia
- [ ] Sugestões personalizadas
- [ ] Atalhos de teclado
- [ ] Animação de destaque

---

### 4.6 Notification Center
**Criar:** Panel de notificações

**Features:**
- [ ] Lista de notificações recentes
- [ ] Mark as read/unread
- [ ] Categorias (sistema, clientes, AI)
- [ ] Sound toggle

---

### Checklist BLOCO 4
- [ ] Instalar/configurar Recharts
- [ ] Criar Revenue Chart component
- [ ] Adicionar sparklines nos stat cards
- [ ] Criar Appointment Heatmap
- [ ] Criar AI Assistant Widget
- [ ] Refatorar Quick Actions
- [ ] Criar Notification Center
- [ ] Integrar tudo no Dashboard principal

**Estimativa:** 56h | **Prioridade:** P1 (Importante)

---

## 🔴 BLOCO 5: ONBOARDING & POLISH
### Objetivo: Guiar first-time users e adicionar polish final

### 5.1 Onboarding Tour
**Criar:** Tour interativo para novos usuários

**Ferramenta:** React Joyride ou similar

**Steps:**
1. Welcome modal com vídeo curto
2. Highlight do Dashboard
3. Tour pela Inbox
4. Configuração do WhatsApp
5. Primeiro agendamento
6. Celebração de conclusão

---

### 5.2 Progress Checklist
**Criar:** Checklist de setup inicial

**Items:**
- [ ] Completar perfil da clínica
- [ ] Conectar WhatsApp
- [ ] Adicionar primeiro serviço
- [ ] Adicionar primeiro profissional
- [ ] Criar primeiro agendamento

**Features:**
- [ ] Progress bar visual
- [ ] Cada item expandível com guia
- [ ] Reward ao completar (confetti)

---

### 5.3 Tooltips Progressivos
**Onde:** Features avançadas

**Features:**
- [ ] Show once por feature
- [ ] Armazenar progresso no localStorage
- [ ] "Got it" button para dismiss

---

### 5.4 Keyboard Shortcuts
**Implementar:**

| Shortcut | Ação |
|----------|------|
| `Cmd+K` | Command palette |
| `Cmd+N` | Novo agendamento |
| `Cmd+/` | Atalhos help |
| `Esc` | Fechar modais |
| `↑↓` | Navegar listas |

---

### 5.5 Custom Illustrations
**Onde:** Empty states, Onboarding, Errors

**Criar ou adquirir:**
- [ ] Ilustração de boas-vindas
- [ ] Empty inbox
- [ ] Empty calendar
- [ ] Error state
- [ ] Success state

---

### 5.6 Sound Effects (Opcional)
**Criar:** Sons sutis para feedback

| Ação | Som |
|------|-----|
| Sucesso | Ding suave |
| Erro | Bloop |
| Notificação | Chime |
| Mensagem | Pop |

**Features:**
- [ ] Toggle no settings
- [ ] Respeitar preferências do sistema
- [ ] Volume baixo e não-intrusivo

---

### Checklist BLOCO 5
- [ ] Implementar Onboarding Tour
- [ ] Criar Progress Checklist no dashboard
- [ ] Adicionar tooltips progressivos
- [ ] Implementar keyboard shortcuts
- [ ] Criar/integrar ilustrações custom
- [ ] Adicionar sound effects (opcional)
- [ ] Testar fluxo completo de novo usuário

**Estimativa:** 40h | **Prioridade:** P2 (Nice to have)

---

## 📁 ESTRUTURA DE ARQUIVOS A CRIAR

```
/src/components/ui/
├── button.tsx          ✅ BLOCO 1
├── input.tsx           ✅ BLOCO 1
├── card.tsx            ✅ BLOCO 1
├── badge.tsx           ✅ BLOCO 1
├── stat-card.tsx       ✅ BLOCO 1
├── dialog.tsx          ✅ BLOCO 1
├── toast.tsx           ✅ BLOCO 1
├── command.tsx         ✅ BLOCO 1
├── tooltip.tsx         ✅ BLOCO 1
├── skeleton.tsx        ✅ BLOCO 1
├── progress.tsx        ✅ BLOCO 2
├── success-animation.tsx ✅ BLOCO 2
├── empty-state.tsx     ✅ BLOCO 2
├── avatar.tsx          ✅ BLOCO 3
└── index.tsx           ✅ ATUALIZAR

/src/components/landing/
├── hero.tsx            ✅ BLOCO 3
├── features.tsx        ✅ BLOCO 3
├── how-it-works.tsx    ✅ BLOCO 3
├── pricing.tsx         ✅ BLOCO 3
├── testimonials.tsx    ✅ BLOCO 3
├── cta-section.tsx     ✅ BLOCO 3
└── footer.tsx          ✅ BLOCO 3

/src/components/dashboard/
├── stat-card.tsx       ✅ BLOCO 4 (enhanced)
├── revenue-chart.tsx   ✅ BLOCO 4
├── appointment-heatmap.tsx ✅ BLOCO 4
├── ai-widget.tsx       ✅ BLOCO 4
├── quick-actions.tsx   ✅ BLOCO 4
├── notification-center.tsx ✅ BLOCO 4
└── onboarding-checklist.tsx ✅ BLOCO 5

/src/components/onboarding/
├── tour.tsx            ✅ BLOCO 5
├── progress-checklist.tsx ✅ BLOCO 5
└── welcome-modal.tsx   ✅ BLOCO 5
```

---

## 📈 MÉTRICAS DE SUCESSO

### UX KPIs
| Métrica | Atual | Meta |
|---------|-------|------|
| Time to First Interaction | ~3s | <1s |
| Onboarding Completion | 0% | >80% |
| Feature Discovery | ~40% | >70% |
| User Satisfaction (NPS) | ? | >50 |

### Performance
| Métrica | Meta |
|---------|------|
| FCP | <1.0s |
| LCP | <2.0s |
| CLS | <0.1 |
| TBT | <200ms |

---

## 🎯 PRÓXIMOS PASSOS

### Para começar AGORA:

1. **BLOCO 1.1** — Criar Button Component
2. **BLOCO 1.2** — Criar Input Component
3. **BLOCO 1.3** — Criar Card Component

Após aprovar a estrutura, podemos iniciar a implementação bloco a bloco.

---

**Quer começar pelo BLOCO 1 (Component Library)?**

Me confirme e iniciamos pela criação do Button Component com todas as variantes.
