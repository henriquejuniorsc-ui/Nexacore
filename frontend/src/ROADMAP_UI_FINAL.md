# 🚀 NEXACORE — ROADMAP DE IMPLEMENTAÇÃO UI/UX

## Avaliação Atual: **7.6/10** (GOOD)
## Meta Final: **9.5/10** (EXCELLENT)

---

## 📊 STATUS DO PROJETO

### ✅ Já Implementado (Foundation sólida)
- [x] **Design System** — `tailwind.config.ts` excepcional (8-point grid, Major Third 1.25, WCAG AAA)
- [x] **Button Component** — Completo com 8 variantes, loading state, icons
- [x] **Motion System** — `motion.tsx` com variants, easing, springs, useCountUp
- [x] **Cores** — Paleta otimizada (#FFC300 CTA, gradient pink→orange, dark #0B1215)

### ❌ Faltando (Oportunidades de melhoria)
- [ ] Component Library completa (Input, Card, Badge, Tooltip, etc.)
- [ ] Microinterações (números animados, confetti, checkmarks)
- [ ] Empty States customizados
- [ ] Data Visualization (Recharts)
- [ ] Landing Page "wow factor"
- [ ] Onboarding tour

---

## 📋 ROADMAP EM 6 BLOCOS

```
┌──────────────────────────────────────────────────────────────────┐
│                    TIMELINE DE IMPLEMENTAÇÃO                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BLOCO 1          BLOCO 2           BLOCO 3                      │
│  Foundation       Components        Microinteractions             │
│  ┌────────┐       ┌────────┐        ┌────────┐                   │
│  │ 8-12h  │──────▶│ 16-20h │───────▶│ 12-16h │                   │
│  └────────┘       └────────┘        └────────┘                   │
│                                           │                       │
│                                           ▼                       │
│                   BLOCO 4           BLOCO 5           BLOCO 6    │
│                   Dashboard         Landing           Onboarding  │
│                   ┌────────┐        ┌────────┐        ┌────────┐ │
│                   │ 20-24h │───────▶│ 24-32h │───────▶│ 20-24h │ │
│                   └────────┘        └────────┘        └────────┘ │
│                                                                   │
│  ════════════════════════════════════════════════════════════════│
│  TOTAL: 100-128 horas (~3-4 semanas full-time)                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔵 BLOCO 1: FOUNDATION (8-12 horas)

### Objetivo
Refinar estrutura de componentes, criar tipos compartilhados, organizar exports.

### Tasks

| Task | Arquivo | Tempo | Prioridade |
|------|---------|-------|------------|
| Auditar/Organizar `/components/ui/` | Estrutura | 1h | P0 |
| Criar tipos compartilhados | `types.ts` | 2h | P0 |
| Refinar CSS variables em globals.css | `globals.css` | 2h | P1 |
| Criar barrel exports atualizados | `index.tsx` | 1h | P1 |
| Documentar tokens e convenções | `README.md` | 2h | P2 |

### Entregáveis
```
/components/ui/
├── types.ts           # Tipos compartilhados
├── index.tsx          # Barrel exports (atualizado)
├── button.tsx         # ✅ Já existe
├── motion.tsx         # ✅ Já existe
└── README.md          # Documentação
```

### Impacto: +0.1 na nota

---

## 🟢 BLOCO 2: COMPONENT LIBRARY (16-20 horas)

### Objetivo
Eliminar repetição inline, criar single source of truth para todos componentes UI.

### Tasks

| Componente | Variantes | Tempo | Prioridade |
|------------|-----------|-------|------------|
| **Input** | text, email, password, search, textarea | 3h | P0 |
| **Card** | default, glass, elevated, interactive | 2h | P0 |
| **Badge** | status, tag, notification, dot | 1.5h | P0 |
| **Tooltip** | top, bottom, left, right | 2h | P1 |
| **Dialog/Modal** | default, confirm, form | 3h | P0 |
| **Skeleton** | text, card, avatar, chart | 2h | P0 |
| **Avatar** | image, initials, gradient fallback | 1.5h | P1 |
| **Progress** | linear, circular, steps | 2h | P1 |
| **Select** | single, multi, searchable | 3h | P1 |

### Entregáveis
```
/components/ui/
├── input.tsx          # Form inputs com validação visual
├── card.tsx           # Glass card + variantes
├── badge.tsx          # Status badges
├── tooltip.tsx        # Radix UI wrapper
├── dialog.tsx         # Modal base
├── skeleton.tsx       # Loading skeletons
├── avatar.tsx         # Com gradient fallback
├── progress.tsx       # Linear + circular
├── select.tsx         # Dropdown/Combobox
└── index.tsx          # Exports atualizados
```

### Especificações Técnicas

#### Input Component
```typescript
// Variantes
variant: 'default' | 'ghost' | 'filled'
size: 'sm' | 'md' | 'lg'
state: 'default' | 'error' | 'success' | 'disabled'

// Features
- Label integrado
- Erro inline com ícone
- Contador de caracteres
- Prefixo/Sufixo (ícones ou texto)
- Clear button opcional
```

#### Card Component
```typescript
// Variantes
variant: 'default' | 'glass' | 'elevated' | 'interactive' | 'gradient-border'
padding: 'none' | 'sm' | 'md' | 'lg'
hover: boolean // Ativa hover effects

// Glass card
backdrop-filter: blur(12px)
background: rgba(22, 30, 46, 0.6)
border: 1px solid rgba(255, 255, 255, 0.08)
```

#### Badge Component
```typescript
// Variantes
variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand'
size: 'sm' | 'md' | 'lg'
dot: boolean // Mostra indicador de ponto

// Notification badge
<Badge variant="error" dot>3</Badge>
```

### Impacto: +0.5 na nota

---

## 🟡 BLOCO 3: MICROINTERAÇÕES (12-16 horas)

### Objetivo
Utilizar Framer Motion ao máximo, criar "delight" na experiência.

### Tasks

| Task | Descrição | Tempo | Prioridade |
|------|-----------|-------|------------|
| **StatCard** | Números animados com useCountUp | 3h | P0 |
| **Hover dramáticos** | scale 1.02-1.05, glow, lift | 2h | P0 |
| **AnimatedCheckmark** | SVG animado para sucesso | 2h | P0 |
| **ErrorShake** | Shake animation para erros | 1h | P1 |
| **Button ripple** | Ripple effect no tap | 2h | P1 |
| **List stagger** | Animação sequencial em listas | 2h | P1 |
| **Confetti** | Para achievements/milestones | 2h | P2 |
| **Toast animations** | Enter/exit suaves | 2h | P1 |

### Entregáveis
```
/components/ui/
├── stat-card.tsx           # Dashboard stats animados
├── animated-checkmark.tsx  # SVG checkmark
├── confetti.tsx            # Efeito de confetti
├── toast.tsx               # Notificações animadas
└── empty-state.tsx         # Estados vazios com ilustrações
```

### Especificações

#### StatCard Component
```typescript
interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;      // "R$", "+", etc.
  suffix?: string;      // "%", "clientes", etc.
  trend?: {
    value: number;      // +500, -20, etc.
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  animate?: boolean;    // Usa useCountUp
}

// Hover: scale 1.02, subtle glow
// Numbers: animate from 0 → value in 600ms
```

#### AnimatedCheckmark
```typescript
// SVG path animation
// Duration: 400ms
// Easing: ease-out
// Color: success (#10B981)
```

### Impacto: +0.4 na nota

---

## 🟠 BLOCO 4: DASHBOARD EVOLUTION (20-24 horas)

### Objetivo
Adicionar visualização de dados, melhorar empty states, criar AI widget.

### Tasks

| Task | Descrição | Tempo | Prioridade |
|------|-----------|-------|------------|
| **Revenue Chart** | Recharts line/area chart | 4h | P0 |
| **Aplicar StatCard** | Substituir cards atuais | 2h | P0 |
| **Empty states SVG** | Ilustrações customizadas | 4h | P0 |
| **Sparklines** | Mini charts nos cards | 3h | P1 |
| **AI Widget** | Assistente flutuante/expandível | 4h | P1 |
| **Quick Actions** | Ações contextuais | 3h | P1 |
| **Notification Center** | Dropdown com histórico | 4h | P2 |

### Entregáveis
```
/components/dashboard/
├── revenue-chart.tsx       # Gráfico de receita
├── sparkline.tsx           # Mini gráficos
├── ai-widget.tsx           # Assistente IA
├── quick-actions.tsx       # Ações rápidas contextuais
├── notification-center.tsx # Centro de notificações
└── stat-grid.tsx           # Grid de StatCards

/components/illustrations/
├── empty-calendar.svg      # Sem agendamentos
├── empty-inbox.svg         # Inbox vazio
├── empty-clients.svg       # Sem clientes
├── empty-chart.svg         # Sem dados
└── welcome.svg             # Boas-vindas
```

### Especificações

#### Revenue Chart
```typescript
// Recharts AreaChart
// Gradient fill: brand-pink → brand-orange (10% opacity)
// Line: brand-pink 2px
// Grid: subtle (#ffffff08)
// Tooltip: glass card style
// Responsive: mobile-friendly
```

#### AI Widget
```typescript
// Estados: collapsed (FAB), expanded (drawer/modal)
// Position: bottom-right fixed
// Animation: slide up + scale
// Features: quick prompts, chat history preview
```

### Impacto: +0.5 na nota

---

## 🔴 BLOCO 5: LANDING PAGE (24-32 horas)

### Objetivo
Criar "wow factor", aumentar conversão com animações e social proof.

### Tasks

| Task | Descrição | Tempo | Prioridade |
|------|-----------|-------|------------|
| **Hero Animation** | Staggered fade-in-up | 3h | P0 |
| **Animated Background** | Gradient mesh ou noise | 3h | P0 |
| **Product Mockup** | Hover highlights, tooltips | 4h | P0 |
| **How It Works** | 3 steps com motion path | 4h | P1 |
| **Testimonials** | Fotos reais + animation | 3h | P0 |
| **Pricing Highlight** | Badge "Recomendado" + scale | 2h | P0 |
| **Live Counter** | "+500 clínicas" animado | 2h | P1 |
| **Video Demo** | Modal ou inline player | 4h | P1 |
| **Feature Cards** | Hover gradient border + lift | 3h | P1 |
| **Newsletter Footer** | Input + button integrado | 2h | P2 |

### Entregáveis
```
/components/landing/
├── hero.tsx               # Hero com animação
├── animated-background.tsx # Background gradient/mesh
├── product-mockup.tsx     # Mockup interativo
├── how-it-works.tsx       # Passo a passo animado
├── testimonials.tsx       # Social proof
├── pricing.tsx            # Cards de preço
├── live-counter.tsx       # Contador animado
├── video-demo.tsx         # Player de vídeo
├── features.tsx           # Grid de features
├── newsletter.tsx         # Signup de newsletter
└── cta-section.tsx        # CTA final
```

### Especificações

#### Hero Animation Sequence
```
1. Background gradient fade-in (0ms)
2. Badge "Novo" slide-down (100ms)
3. Headline fade-in-up (200ms)
4. Subheadline fade-in-up (350ms)
5. CTAs scale-in (500ms)
6. Trust badges fade-in (650ms)
7. Product mockup fade-in-up (800ms)
```

#### Animated Background
```css
/* Gradient mesh ou */
background: 
  radial-gradient(ellipse 80% 50% at 50% -20%, 
    rgba(255, 0, 110, 0.15) 0%, 
    rgba(251, 86, 7, 0.08) 40%, 
    transparent 70%);

/* Noise overlay opcional */
background-image: url("data:image/svg+xml,...");
```

### Impacto: +0.3 na nota

---

## 🟣 BLOCO 6: ONBOARDING & POLISH (20-24 horas)

### Objetivo
Guiar usuários first-time, adicionar features power-user, polish final.

### Tasks

| Task | Descrição | Tempo | Prioridade |
|------|-----------|-------|------------|
| **Onboarding Tour** | React Joyride ou custom | 6h | P0 |
| **Command Palette** | Cmd+K com cmdk | 4h | P0 |
| **Progressive Tooltips** | First-time hints | 3h | P1 |
| **Keyboard Shortcuts** | Full coverage + cheatsheet | 3h | P1 |
| **Custom Illustrations** | 5-8 SVGs para empty states | 4h | P1 |
| **Dark/Light Toggle** | Theme switcher | 3h | P2 |
| **Sound Effects** | Sutil, disableable | 2h | P3 |

### Entregáveis
```
/components/onboarding/
├── tour.tsx              # Tour interativo
├── tooltip-hint.tsx      # Hint progressivo
├── checklist.tsx         # Checklist de setup
└── welcome-modal.tsx     # Modal de boas-vindas

/components/ui/
├── command.tsx           # Command palette (Cmd+K)
├── kbd.tsx               # Keyboard shortcut display
└── theme-toggle.tsx      # Dark/Light switcher
```

### Especificações

#### Onboarding Tour Steps
```typescript
const tourSteps = [
  { target: '.sidebar', content: 'Navegue entre as seções aqui' },
  { target: '.stat-cards', content: 'Acompanhe suas métricas em tempo real' },
  { target: '.quick-actions', content: 'Ações rápidas para agilizar seu dia' },
  { target: '.ai-widget', content: 'Seu assistente de IA está sempre disponível' },
  { target: '.inbox-badge', content: 'Conversas do WhatsApp aparecem aqui' },
];
```

#### Command Palette
```typescript
// Atalho: Cmd+K (Mac) / Ctrl+K (Windows)
// Features:
// - Busca fuzzy em páginas
// - Ações rápidas (novo agendamento, novo cliente)
// - Navegação recente
// - Atalhos de teclado inline
```

### Impacto: +0.3 na nota

---

## 📈 MÉTRICAS DE SUCESSO

### UX KPIs

| Métrica | Atual | Meta | Método de Medição |
|---------|-------|------|-------------------|
| Time to First Interaction | ~3s | <1s | Web Vitals |
| Onboarding Completion | 0% | >80% | Analytics |
| Feature Discovery | ~40% | >60% | Heatmaps |
| Task Completion Rate | ~75% | >90% | Session recording |
| Error Rate | ~8% | <3% | Sentry |

### Performance (Core Web Vitals)

| Métrica | Meta |
|---------|------|
| First Contentful Paint (FCP) | <1.0s |
| Largest Contentful Paint (LCP) | <2.0s |
| Cumulative Layout Shift (CLS) | <0.1 |
| Total Blocking Time (TBT) | <200ms |
| Interaction to Next Paint (INP) | <200ms |

---

## 🗂️ ESTRUTURA FINAL DE ARQUIVOS

```
/src/components/
├── ui/
│   ├── button.tsx          ✅ Existe
│   ├── motion.tsx          ✅ Existe
│   ├── input.tsx           🔵 Bloco 2
│   ├── card.tsx            🔵 Bloco 2
│   ├── badge.tsx           🔵 Bloco 2
│   ├── tooltip.tsx         🔵 Bloco 2
│   ├── dialog.tsx          🔵 Bloco 2
│   ├── skeleton.tsx        🔵 Bloco 2
│   ├── avatar.tsx          🔵 Bloco 2
│   ├── progress.tsx        🔵 Bloco 2
│   ├── select.tsx          🔵 Bloco 2
│   ├── stat-card.tsx       🟡 Bloco 3
│   ├── animated-checkmark.tsx 🟡 Bloco 3
│   ├── confetti.tsx        🟡 Bloco 3
│   ├── toast.tsx           🟡 Bloco 3
│   ├── empty-state.tsx     🟡 Bloco 3
│   ├── command.tsx         🟣 Bloco 6
│   ├── kbd.tsx             🟣 Bloco 6
│   ├── theme-toggle.tsx    🟣 Bloco 6
│   ├── types.ts            🔵 Bloco 1
│   ├── index.tsx           🔵 Bloco 1
│   └── README.md           🔵 Bloco 1
│
├── dashboard/
│   ├── revenue-chart.tsx   🟠 Bloco 4
│   ├── sparkline.tsx       🟠 Bloco 4
│   ├── ai-widget.tsx       🟠 Bloco 4
│   ├── quick-actions.tsx   🟠 Bloco 4
│   ├── notification-center.tsx 🟠 Bloco 4
│   └── stat-grid.tsx       🟠 Bloco 4
│
├── landing/
│   ├── hero.tsx            🔴 Bloco 5
│   ├── animated-background.tsx 🔴 Bloco 5
│   ├── product-mockup.tsx  🔴 Bloco 5
│   ├── how-it-works.tsx    🔴 Bloco 5
│   ├── testimonials.tsx    🔴 Bloco 5
│   ├── pricing.tsx         🔴 Bloco 5
│   ├── live-counter.tsx    🔴 Bloco 5
│   ├── video-demo.tsx      🔴 Bloco 5
│   ├── features.tsx        🔴 Bloco 5
│   ├── newsletter.tsx      🔴 Bloco 5
│   └── cta-section.tsx     🔴 Bloco 5
│
├── onboarding/
│   ├── tour.tsx            🟣 Bloco 6
│   ├── tooltip-hint.tsx    🟣 Bloco 6
│   ├── checklist.tsx       🟣 Bloco 6
│   └── welcome-modal.tsx   🟣 Bloco 6
│
└── illustrations/
    ├── empty-calendar.svg  🟠 Bloco 4
    ├── empty-inbox.svg     🟠 Bloco 4
    ├── empty-clients.svg   🟠 Bloco 4
    ├── empty-chart.svg     🟠 Bloco 4
    └── welcome.svg         🟣 Bloco 6
```

---

## 🎯 PRÓXIMOS PASSOS

### Para iniciar Bloco 1:
1. ✅ Extrair projeto
2. ✅ Analisar código existente
3. ✅ Criar roadmap (este documento)
4. ⏳ Criar `/components/ui/types.ts`
5. ⏳ Atualizar `/components/ui/index.tsx`
6. ⏳ Refinar `globals.css` se necessário

### Comando para começar:
```bash
# Bloco 1 → 2 → 3 → 4 → 5 → 6
# Cada bloco depende do anterior
```

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

### Princípios de Design (do Research)
1. **Neurociência**: Processamento visual 100-300ms, limite 3-7 chunks WM
2. **Matemática**: φ=1.618, grid 8pt, escala tipográfica 1.25
3. **Cores**: Contraste > cor específica, CTA amarelo +21% conversão
4. **Motion**: 200-500ms, ease-out entrada, ease-in saída
5. **Acessibilidade**: WCAG AA mínimo, 44px touch targets, reduced-motion

### Stack Confirmada
- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3.4+
- Framer Motion 10+
- Radix UI Primitives
- Lucide Icons
- Recharts

---

*Roadmap criado em: 04 de Fevereiro de 2026*
*Última atualização: 04 de Fevereiro de 2026*
*Status: PRONTO PARA IMPLEMENTAÇÃO*
