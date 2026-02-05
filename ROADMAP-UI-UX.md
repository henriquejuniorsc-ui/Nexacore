# 🚀 NEXACORE UI/UX ROADMAP
## Plano de Implementação em 6 Blocos | Fevereiro 2026

---

## 📊 ANÁLISE ATUALIZADA DO ESTADO ATUAL

### ✅ O QUE JÁ EXISTE (Excelente Base)

| Componente | Status | Qualidade |
|------------|--------|-----------|
| **Button** (`/components/ui/button.tsx`) | ✅ Completo | 9/10 - 9 variants, motion, loading states |
| **Card** (`/components/ui/card.tsx`) | ✅ Completo | 8.5/10 - Glass, motion, StatCard básico |
| **Input** (`/components/ui/input.tsx`) | ✅ Completo | 9/10 - Validação inline, shake, SearchInput, FormField |
| **Motion System** (`/components/ui/motion.tsx`) | ✅ Completo | 9/10 - useCountUp, FadeInView, stagger, springs |
| **Tailwind Config** | ✅ Completo | 9.5/10 - 457 linhas, documentação científica |
| **globals.css** | ✅ Completo | 8.5/10 - 1408 linhas organizadas |
| **Landing Page** | ✅ Funcional | 7.5/10 - Todas seções, mas hero estático |
| **Dashboard** | ✅ Funcional | 7/10 - Não usa componentes centralizados |

### 📦 Dependências Já Instaladas (Prontas para Usar)

```
✅ framer-motion    — Sistema de animação (usando)
✅ recharts         — Gráficos (NÃO USADO)
✅ cmdk             — Command palette (NÃO USADO)
✅ next-themes      — Dark/Light mode (NÃO USADO)
✅ sonner           — Toast notifications (parcialmente)
✅ @radix-ui/*      — Primitivos de UI (parcialmente)
✅ react-day-picker — Calendário
```

### ❌ O QUE FALTA IMPLEMENTAR

| Item | Prioridade | Impacto |
|------|-----------|---------|
| Componentes Badge, Skeleton, Avatar, Progress, EmptyState | P0 | Consistência |
| Command Palette (Cmd+K) | P0 | Power users |
| Dashboard usando StatCard com useCountUp | P0 | Animação |
| Charts Recharts no Dashboard | P1 | Visualização |
| Hero entrance animation | P1 | First impression |
| Onboarding tour | P1 | First-time UX |
| Dark/Light theme toggle | P2 | User preference |
| Ilustrações customizadas | P2 | Personality |

---

## 🗺️ ROADMAP EM 6 BLOCOS

```
┌─────────────────────────────────────────────────────────────────────┐
│  BLOCO 1: Foundation        │  BLOCO 2: Microinteractions         │
│  [8-10 horas] P0            │  [10-14 horas] P0                    │
│  - Badge, Skeleton, Avatar  │  - Stat cards com useCountUp        │
│  - Progress, EmptyState     │  - Enhanced hover effects           │
│  - Command Palette (cmdk)   │  - Success/Error animations         │
│  - Update index.tsx exports │  - Button ripple effect             │
├─────────────────────────────┴────────────────────────────────────────┤
│  BLOCO 3: Dashboard Evolution          │  BLOCO 4: Landing Impact   │
│  [16-20 horas] P1                      │  [12-16 horas] P1          │
│  - Revenue chart (Recharts)            │  - Hero entrance animation │
│  - Sparklines nos stat cards           │  - Background mesh animado │
│  - AI Widget expandable                │  - Mockup interativo       │
│  - Notification center                 │  - Live user counter       │
│  - Empty states ilustrados             │  - Video demo section      │
├────────────────────────────────────────┴─────────────────────────────┤
│  BLOCO 5: Onboarding & Power Features  │  BLOCO 6: Final Polish    │
│  [14-18 horas] P1                      │  [10-14 horas] P2         │
│  - Tour interativo (react-joyride)     │  - Refactor todas páginas │
│  - Tooltips progressivos               │  - Dark/Light toggle      │
│  - Keyboard shortcuts                  │  - Cross-browser testing  │
│  - Checklist de setup                  │  - Performance audit      │
└──────────────────────────────────────────────────────────────────────┘

TOTAL ESTIMADO: 70-92 horas (~2-3 semanas)
NOTA ATUAL: 7.6/10 → META: 9.0+/10
```

---

## 📁 BLOCO 1: FOUNDATION
**Duração:** 8-10 horas | **Prioridade:** P0 — Crítico

### Objetivo
Completar a biblioteca de componentes UI reutilizáveis antes de qualquer outra implementação.

### 1.1 Componentes a Criar

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| **Badge** | `/components/ui/badge.tsx` | Status badges (success, warning, error, info, neutral) |
| **Skeleton** | `/components/ui/skeleton.tsx` | Loading placeholders extraídos do dashboard |
| **Avatar** | `/components/ui/avatar.tsx` | Wrapper Radix com fallback de iniciais |
| **Progress** | `/components/ui/progress.tsx` | Linear + circular progress bars |
| **Tooltip** | `/components/ui/tooltip.tsx` | Wrapper Radix com estilos NexaCore |
| **Dialog** | `/components/ui/dialog.tsx` | Modal wrapper Radix |
| **EmptyState** | `/components/ui/empty-state.tsx` | Template para estados vazios |

### 1.2 Command Palette (cmdk)

```tsx
// /components/ui/command.tsx
// Usar biblioteca cmdk já instalada
// Implementar:
// - Cmd+K para abrir
// - Busca em páginas, actions, clientes
// - Keyboard navigation
```

### 1.3 Atualizar Index Exports

```tsx
// /components/ui/index.tsx — adicionar:
export * from "./badge";
export * from "./skeleton";
export * from "./avatar";
export * from "./progress";
export * from "./tooltip";
export * from "./dialog";
export * from "./empty-state";
export * from "./command";
```

### Checklist Bloco 1
- [ ] Badge com 6 variants (default, success, warning, error, info, outline)
- [ ] Skeleton com shimmer animation
- [ ] Avatar com Radix + fallback initials + gradient colors
- [ ] Progress linear e circular
- [ ] Tooltip com delay e posicionamento
- [ ] Dialog com animação fade/scale
- [ ] EmptyState com slots para icon, title, description, action
- [ ] Command palette funcional com Cmd+K
- [ ] Todos exports atualizados no index.tsx

---

## ⚡ BLOCO 2: MICROINTERACTIONS
**Duração:** 10-14 horas | **Prioridade:** P0 — Alto Impacto Visual

### Objetivo
Transformar a UI estática em uma experiência "viva" utilizando o sistema de motion já existente.

### 2.1 Dashboard Stat Cards com useCountUp

**Arquivo:** `/app/(dashboard)/dashboard/page.tsx`

```tsx
// ANTES (atual):
<p className="text-2xl font-bold">{value}</p>

// DEPOIS:
import { useCountUp } from "@/components/ui";

function AnimatedStatCard({ value }: { value: number }) {
  const count = useCountUp(value, 800, true);
  return <p className="text-2xl font-bold tabular-nums">{count}</p>;
}
```

### 2.2 Enhanced Hover Effects

```tsx
// Adicionar ao motion.tsx:
export const cardHoverPremium = {
  rest: { 
    y: 0, 
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderColor: "rgba(255,255,255,0.07)"
  },
  hover: { 
    y: -4, 
    boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
    borderColor: "rgba(255,255,255,0.15)"
  }
};
```

### 2.3 Success Animation (Checkmark)

```tsx
// /components/ui/animated-checkmark.tsx
// SVG path animation para confirmações
// Usar em: formulários, ações completadas
```

### 2.4 Error Shake (Já no Input, expandir)

```tsx
// Criar hook reutilizável:
// /hooks/useShake.ts
export function useShake() {
  const [shake, setShake] = useState(false);
  const trigger = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };
  return { shake, trigger };
}
```

### 2.5 Button Ripple Effect

```tsx
// Adicionar ao MotionButton:
// Ripple effect on click (Material Design style)
// Opcional: pode ser toggle via prop
```

### Checklist Bloco 2
- [ ] StatCard usando useCountUp do motion system
- [ ] Card hover premium com lift + shadow + border
- [ ] Animated checkmark SVG component
- [ ] Hook useShake reutilizável
- [ ] Button ripple effect opcional
- [ ] List item stagger animation
- [ ] Skeleton shimmer melhorado
- [ ] Loading button spinner consistente

---

## 📈 BLOCO 3: DASHBOARD EVOLUTION
**Duração:** 16-20 horas | **Prioridade:** P1 — Valor de Negócio

### Objetivo
Adicionar visualização de dados e melhorar empty states com personalidade.

### 3.1 Revenue Chart (Recharts)

```tsx
// /components/dashboard/revenue-chart.tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// Features:
// - Gradient fill matching brand colors
// - Custom tooltip styling
// - Responsive container
// - Period selector (7d, 30d, 90d)
```

### 3.2 Sparklines nos Stat Cards

```tsx
// Mini line charts dentro dos StatCard
// Mostra tendência dos últimos 7 dias
// Usa Recharts ResponsiveContainer mini
```

### 3.3 AI Widget Expandable

```tsx
// /components/dashboard/ai-widget.tsx
// Floating button que expande para chat
// Integra com /api/ai/chat existente
```

### 3.4 Notification Center

```tsx
// /components/dashboard/notification-center.tsx
// Dropdown no header com histórico
// Mark as read functionality
// Empty state quando vazio
```

### 3.5 Empty States Ilustrados

```
/public/illustrations/
├── empty-appointments.svg
├── empty-clients.svg
├── empty-inbox.svg
├── empty-reminders.svg
└── empty-payments.svg
```

### API Enhancements Necessárias

```tsx
// /api/dashboard/route.ts — adicionar:
// - chartData: últimos 30 dias de receita
// - sparklineData: últimos 7 dias por métrica
// - notifications: últimas 20 notificações
```

### Checklist Bloco 3
- [ ] RevenueChart com AreaChart Recharts
- [ ] Sparklines integrados ao StatCard
- [ ] AI Widget expandable/collapsible
- [ ] Notification center dropdown
- [ ] 5 ilustrações SVG para empty states
- [ ] EmptyState components específicos por contexto
- [ ] API retornando dados de chart
- [ ] Loading states para todos os novos componentes

---

## 🎯 BLOCO 4: LANDING PAGE IMPACT
**Duração:** 12-16 horas | **Prioridade:** P1 — Conversão

### Objetivo
Criar "wow factor" na primeira impressão para aumentar conversão.

### 4.1 Hero Entrance Animation

```tsx
// Staggered entrance:
// 1. Badge "Novo" fade in
// 2. Headline slide up
// 3. Subheadline fade in
// 4. CTAs scale in
// 5. Product mockup slide from bottom
```

### 4.2 Background Animated Mesh

```tsx
// CSS gradient mesh com subtle movement
// Ou: Particle effect com Canvas (performance-safe)
// Respeitar prefers-reduced-motion
```

### 4.3 Interactive Product Mockup

```tsx
// Hover highlights em áreas do mockup
// Tooltips explicando features
// Possível: mini demo interativo
```

### 4.4 Live User Counter

```tsx
// "+527 clínicas" com useCountUp
// Número atualiza periodicamente (ou fake animation)
```

### 4.5 Video Demo Section

```tsx
// Modal com player de vídeo
// Thumbnail com play button overlay
// Lazy load do iframe
```

### 4.6 Pricing Card "Recomendado"

```tsx
// Destaque visual no plano Professional
// Badge "Mais Popular"
// Scale 1.05 ou border gradient
```

### Checklist Bloco 4
- [ ] Hero entrance staggered animation
- [ ] Background gradient/mesh animado
- [ ] Mockup com hover tooltips
- [ ] Live counter de clínicas
- [ ] Video demo modal
- [ ] Pricing "Recomendado" destacado
- [ ] Testimonials com fotos (ou melhor fallback)
- [ ] Newsletter signup no footer

---

## 🎓 BLOCO 5: ONBOARDING & POWER FEATURES
**Duração:** 14-18 horas | **Prioridade:** P1 — Retenção

### Objetivo
Guiar novos usuários e dar superpoderes aos avançados.

### 5.1 Onboarding Tour

```tsx
// Usar react-joyride ou similar
// Steps:
// 1. Welcome modal
// 2. Highlight sidebar navigation
// 3. Explain stat cards
// 4. Show quick actions
// 5. Point to AI assistant
// 6. Celebrate completion
```

### 5.2 Progressive Tooltips

```tsx
// Tooltips que aparecem apenas first-time
// Stored in localStorage ou DB
// Dismissed after interaction
```

### 5.3 Keyboard Shortcuts

```tsx
// Global shortcuts:
// Cmd+K: Command palette
// Cmd+N: Novo agendamento
// Cmd+/: Show shortcuts
// G then D: Go to Dashboard
// G then I: Go to Inbox
// G then S: Go to Settings
```

### 5.4 Setup Checklist

```tsx
// /components/onboarding/setup-checklist.tsx
// Persistent checklist que mostra:
// ✅ Configurar clínica
// ⬜ Conectar WhatsApp
// ⬜ Adicionar primeiro cliente
// ⬜ Criar primeiro agendamento
// ⬜ Configurar IA
```

### Checklist Bloco 5
- [ ] Tour interativo com 5-7 steps
- [ ] Tooltips first-time para features chave
- [ ] Keyboard shortcuts globais
- [ ] Cheatsheet de atalhos (Cmd+/)
- [ ] Setup checklist persistente
- [ ] "Pular tour" option
- [ ] Tracking de onboarding completion

---

## ✨ BLOCO 6: FINAL POLISH
**Duração:** 10-14 horas | **Prioridade:** P2 — Excelência

### Objetivo
Refinar, testar e garantir consistência em toda a aplicação.

### 6.1 Refactor Todas as Páginas

```
Páginas para atualizar com novos componentes:
├── /dashboard — usar StatCard, charts
├── /appointments — usar Badge, EmptyState
├── /clients — usar Avatar, Badge, EmptyState
├── /inbox — usar Badge, Avatar
├── /settings — usar Card, Input consistentes
├── /products — usar EmptyState
└── /payments — usar Badge, EmptyState
```

### 6.2 Dark/Light Theme Toggle

```tsx
// Usar next-themes já instalado
// Toggle no header/settings
// Persist preference
// Respeitar system preference
```

### 6.3 Testing & QA

- [ ] Cross-browser: Chrome, Firefox, Safari, Edge
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Responsive breakpoints: 375px, 768px, 1024px, 1440px
- [ ] Accessibility: screen reader, keyboard nav
- [ ] Performance: Lighthouse audit

### 6.4 Performance Optimization

- [ ] Image optimization (next/image)
- [ ] Font subsetting
- [ ] Code splitting verificado
- [ ] CSS purge funcionando
- [ ] Bundle size < 200kb inicial

### Checklist Bloco 6
- [ ] Todas páginas usando component library
- [ ] Dark/Light toggle funcional
- [ ] Cross-browser testado
- [ ] Mobile testado
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Accessibility audit passed

---

## 📋 ARQUIVOS A CRIAR (RESUMO)

```
/src/components/ui/
├── badge.tsx              # BLOCO 1
├── skeleton.tsx           # BLOCO 1
├── avatar.tsx             # BLOCO 1
├── progress.tsx           # BLOCO 1
├── tooltip.tsx            # BLOCO 1
├── dialog.tsx             # BLOCO 1
├── empty-state.tsx        # BLOCO 1
├── command.tsx            # BLOCO 1
├── animated-checkmark.tsx # BLOCO 2
└── index.tsx              # UPDATE

/src/components/dashboard/
├── revenue-chart.tsx      # BLOCO 3
├── sparkline.tsx          # BLOCO 3
├── ai-widget.tsx          # BLOCO 3
└── notification-center.tsx # BLOCO 3

/src/components/landing/
├── hero-animated.tsx      # BLOCO 4
├── animated-background.tsx # BLOCO 4
├── product-mockup.tsx     # BLOCO 4
├── live-counter.tsx       # BLOCO 4
└── video-demo.tsx         # BLOCO 4

/src/components/onboarding/
├── tour.tsx               # BLOCO 5
├── setup-checklist.tsx    # BLOCO 5
└── tooltip-hint.tsx       # BLOCO 5

/public/illustrations/
├── empty-appointments.svg # BLOCO 3
├── empty-clients.svg      # BLOCO 3
├── empty-inbox.svg        # BLOCO 3
├── empty-reminders.svg    # BLOCO 3
└── empty-payments.svg     # BLOCO 3

/src/hooks/
├── useShake.ts            # BLOCO 2
├── useKeyboardShortcuts.ts # BLOCO 5
└── useOnboardingProgress.ts # BLOCO 5
```

---

## 🎯 MÉTRICAS DE SUCESSO

### UX KPIs
| Métrica | Atual | Meta |
|---------|-------|------|
| Time to First Interaction | ~3s | <1s |
| Onboarding Completion | 0% | >80% |
| Feature Discovery | ~40% | >70% |
| Lighthouse Performance | ~75 | >90 |
| WCAG Compliance | AA | AAA |

### Nota Estimada por Bloco
| Bloco | Impacto Esperado |
|-------|------------------|
| Bloco 1 | 7.6 → 7.9 (+0.3) |
| Bloco 2 | 7.9 → 8.3 (+0.4) |
| Bloco 3 | 8.3 → 8.7 (+0.4) |
| Bloco 4 | 8.7 → 9.0 (+0.3) |
| Bloco 5 | 9.0 → 9.3 (+0.3) |
| Bloco 6 | 9.3 → 9.5 (+0.2) |

**META FINAL: 9.5/10 (EXCELLENT)**

---

## 🚦 ORDEM DE EXECUÇÃO RECOMENDADA

```
1. BLOCO 1 (Foundation) ← INICIAR AQUI
   ↓
2. BLOCO 2 (Microinteractions)
   ↓
3. BLOCO 3 (Dashboard) ou BLOCO 4 (Landing)
   ↓ ↓
   [Paralelo se houver múltiplos devs]
   ↓ ↓
4. BLOCO 5 (Onboarding)
   ↓
5. BLOCO 6 (Polish)
```

**Dependências:**
- Bloco 2 depende de Bloco 1 (componentes base)
- Blocos 3 e 4 podem ser paralelos
- Bloco 5 depende de Blocos 1-4
- Bloco 6 depende de todos anteriores

---

## ⏰ CRONOGRAMA SUGERIDO

| Semana | Blocos | Horas |
|--------|--------|-------|
| Semana 1 | Bloco 1 + Bloco 2 | 18-24h |
| Semana 2 | Bloco 3 | 16-20h |
| Semana 3 | Bloco 4 + Bloco 5 | 26-34h |
| Semana 4 | Bloco 6 | 10-14h |

**Total: ~70-92 horas em 4 semanas**

---

*Roadmap criado em: 04 de Fevereiro de 2026*
*Baseado em análise de 38.186 linhas de código*
*Componentes existentes: Button, Card, Input, Motion (completos)*
