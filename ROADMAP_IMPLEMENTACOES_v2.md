# 🚀 NEXACORE — ROADMAP DE IMPLEMENTAÇÕES v2.0
## Elevação de 7.6/10 → 9.5/10

**Data:** Fevereiro 2026  
**Metodologia:** Implementação iterativa em sub-blocos

---

## 📊 VISÃO GERAL EXECUTIVA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BLOCO 1: COMPONENT LIBRARY    │ 5 sub-blocos │ ~32h │ +0.5 nota │ CRÍTICO  │
├─────────────────────────────────────────────────────────────────────────────┤
│  BLOCO 2: MICROINTERAÇÕES      │ 4 sub-blocos │ ~24h │ +0.4 nota │ CRÍTICO  │
├─────────────────────────────────────────────────────────────────────────────┤
│  BLOCO 3: LANDING PAGE         │ 4 sub-blocos │ ~32h │ +0.4 nota │ ALTO     │
├─────────────────────────────────────────────────────────────────────────────┤
│  BLOCO 4: DASHBOARD EVOLUTION  │ 4 sub-blocos │ ~40h │ +0.5 nota │ ALTO     │
├─────────────────────────────────────────────────────────────────────────────┤
│  BLOCO 5: ONBOARDING & POLISH  │ 3 sub-blocos │ ~24h │ +0.3 nota │ MÉDIO    │
└─────────────────────────────────────────────────────────────────────────────┘

TOTAL: 20 sub-blocos │ ~152 horas │ Meta: 9.5/10
```

---

## 🔵 BLOCO 1: COMPONENT LIBRARY BASE
### Objetivo: Single Source of Truth para todos os componentes UI

### Dependências do Bloco
- Nenhuma (ponto de partida)

### Arquivos Base Existentes
- ✅ `/src/components/ui/motion.tsx` — Animações Framer Motion
- ✅ `/src/components/ui/index.tsx` — Barrel exports
- ✅ `/tailwind.config.ts` — Design tokens documentados
- ✅ `/src/app/globals.css` — Estilos base

---

### 📦 SUB-BLOCO 1.1: Componentes Fundamentais
**Estimativa:** 6-8 horas | **Prioridade:** P0

#### Arquivos a Criar:
```
/src/components/ui/
├── button.tsx      # Botões com todas variantes
├── badge.tsx       # Status badges
└── skeleton.tsx    # Loading skeletons
```

#### 1.1.1 — Button Component
**Arquivo:** `/src/components/ui/button.tsx`

| Variante | Cor | Uso | Hover Effect |
|----------|-----|-----|--------------|
| `primary` | `#FFC300` (CTA Yellow) | Ações principais | Glow + scale 1.02 |
| `secondary` | Glass effect | Ações secundárias | Border glow |
| `ghost` | Transparente | Ações terciárias | Background fade |
| `danger` | `#EF4444` | Ações destrutivas | Shake subtle |
| `brand` | Gradiente rosa→laranja | Marketing | Brightness |

**Props Interface:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}
```

**Requisitos:**
- [ ] 5 variantes visuais
- [ ] 3 tamanhos (sm: 32px, md: 40px, lg: 48px)
- [ ] Loading state com spinner animado
- [ ] Disabled state (opacity + cursor)
- [ ] Framer Motion hover/tap
- [ ] Focus ring para acessibilidade
- [ ] Suporte a ícones (left/right)

---

#### 1.1.2 — Badge Component
**Arquivo:** `/src/components/ui/badge.tsx`

| Status | Cor | Uso |
|--------|-----|-----|
| `success` | Verde | Confirmações, "Conectado" |
| `warning` | Amarelo | Alertas, "Pendente" |
| `error` | Vermelho | Erros, "Falhou" |
| `info` | Azul | Informações |
| `neutral` | Cinza | Default |
| `hot` | `#FF006E` | Lead quente |
| `warm` | `#FB5607` | Lead morno |
| `cold` | `#3B82F6` | Lead frio |

**Props Interface:**
```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'hot' | 'warm' | 'cold';
  size: 'sm' | 'md';
  dot?: boolean;        // Dot indicator
  pulse?: boolean;      // Pulse animation
  children: React.ReactNode;
}
```

**Requisitos:**
- [ ] 8 variantes de cor
- [ ] 2 tamanhos
- [ ] Dot indicator opcional
- [ ] Pulse animation opcional
- [ ] Border radius pill

---

#### 1.1.3 — Skeleton Component
**Arquivo:** `/src/components/ui/skeleton.tsx`

| Variante | Uso |
|----------|-----|
| `text` | Linhas de texto |
| `avatar` | Círculo para avatar |
| `card` | Retângulo para cards |
| `stat` | Formato stat card |
| `custom` | Aceita className |

**Props Interface:**
```typescript
interface SkeletonProps {
  variant: 'text' | 'avatar' | 'card' | 'stat' | 'custom';
  width?: string | number;
  height?: string | number;
  lines?: number;        // Para variant='text'
  className?: string;
}
```

**Requisitos:**
- [ ] Shimmer animation (gradiente animado)
- [ ] 5 variantes
- [ ] Responsivo
- [ ] prefers-reduced-motion respeitado

---

#### ✅ Checklist Sub-Bloco 1.1
- [ ] Criar `/src/components/ui/button.tsx`
- [ ] Criar `/src/components/ui/badge.tsx`
- [ ] Criar `/src/components/ui/skeleton.tsx`
- [ ] Testar todos os estados
- [ ] Documentar props no código
- [ ] Atualizar `/src/components/ui/index.tsx`

---

### 📦 SUB-BLOCO 1.2: Formulários
**Estimativa:** 6-8 horas | **Prioridade:** P0

#### Arquivos a Criar:
```
/src/components/ui/
├── input.tsx       # Text inputs
├── textarea.tsx    # Multi-line input
└── select.tsx      # Dropdown select
```

#### 1.2.1 — Input Component
**Arquivo:** `/src/components/ui/input.tsx`

**Props Interface:**
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'search' | 'tel' | 'number';
  label?: string;
  placeholder?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  disabled?: boolean;
  size: 'sm' | 'md' | 'lg';
}
```

**Requisitos:**
- [ ] Float label animation
- [ ] Error/Success states visuais
- [ ] Password toggle visibility
- [ ] Search com debounce
- [ ] Clear button
- [ ] Character counter (opcional)
- [ ] Helper text
- [ ] Focus ring
- [ ] Ícones left/right

---

#### 1.2.2 — Textarea Component
**Arquivo:** `/src/components/ui/textarea.tsx`

**Requisitos:**
- [ ] Auto-resize
- [ ] Character counter
- [ ] Max height
- [ ] Error/Success states

---

#### 1.2.3 — Select Component
**Arquivo:** `/src/components/ui/select.tsx`

**Requisitos:**
- [ ] Dropdown animado (Framer Motion)
- [ ] Search/Filter
- [ ] Multi-select opcional
- [ ] Clear selection
- [ ] Option groups
- [ ] Loading state

---

#### ✅ Checklist Sub-Bloco 1.2
- [ ] Criar `/src/components/ui/input.tsx`
- [ ] Criar `/src/components/ui/textarea.tsx`
- [ ] Criar `/src/components/ui/select.tsx`
- [ ] Testar validação inline
- [ ] Testar acessibilidade (labels, aria)
- [ ] Atualizar exports

---

### 📦 SUB-BLOCO 1.3: Containers
**Estimativa:** 4-6 horas | **Prioridade:** P0

#### Arquivos a Criar:
```
/src/components/ui/
├── card.tsx        # Card container
└── dialog.tsx      # Modal dialog
```

#### 1.3.1 — Card Component
**Arquivo:** `/src/components/ui/card.tsx`

| Variante | Características |
|----------|-----------------|
| `default` | Background + border sutil |
| `glass` | Glassmorphism (backdrop-blur) |
| `elevated` | Shadow para destaque |
| `interactive` | Hover lift effect |
| `gradient` | Border gradient brand |

**Props Interface:**
```typescript
interface CardProps {
  variant: 'default' | 'glass' | 'elevated' | 'interactive' | 'gradient';
  padding: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}
```

**Requisitos:**
- [ ] 5 variantes
- [ ] Header/Body/Footer slots
- [ ] Collapsible com animação
- [ ] Hover effects por variante
- [ ] Loading skeleton state

---

#### 1.3.2 — Dialog Component
**Arquivo:** `/src/components/ui/dialog.tsx`

**Props Interface:**
```typescript
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Requisitos:**
- [ ] AnimatePresence enter/exit
- [ ] Backdrop blur
- [ ] Close on Escape
- [ ] Close on overlay click (opcional)
- [ ] 5 tamanhos
- [ ] Prevent body scroll
- [ ] Focus trap
- [ ] Portal rendering

---

#### ✅ Checklist Sub-Bloco 1.3
- [ ] Criar `/src/components/ui/card.tsx`
- [ ] Criar `/src/components/ui/dialog.tsx`
- [ ] Testar animações
- [ ] Testar acessibilidade
- [ ] Atualizar exports

---

### 📦 SUB-BLOCO 1.4: Feedback
**Estimativa:** 6-8 horas | **Prioridade:** P0

#### Arquivos a Criar:
```
/src/components/ui/
├── toast.tsx       # Notificações toast
├── tooltip.tsx     # Tooltips
└── progress.tsx    # Progress bars
```

#### 1.4.1 — Toast Component
**Arquivo:** `/src/components/ui/toast.tsx`

| Tipo | Ícone | Animação |
|------|-------|----------|
| `success` | Checkmark | Slide in + checkmark animado |
| `error` | X | Shake + X animado |
| `warning` | ! | Pulse |
| `info` | i | Fade in |

**Requisitos:**
- [ ] 4 tipos visuais
- [ ] Auto dismiss configurável
- [ ] Stack de múltiplos toasts
- [ ] Action button opcional
- [ ] Progress bar de dismiss
- [ ] Close manual
- [ ] useToast hook

---

#### 1.4.2 — Tooltip Component
**Arquivo:** `/src/components/ui/tooltip.tsx`

**Requisitos:**
- [ ] 4 posições (top, right, bottom, left)
- [ ] Delay configurável
- [ ] Arrow pointer
- [ ] Rich content support
- [ ] Touch device support

---

#### 1.4.3 — Progress Component
**Arquivo:** `/src/components/ui/progress.tsx`

**Requisitos:**
- [ ] Linear progress bar
- [ ] Circular progress
- [ ] Indeterminate state
- [ ] Animação suave
- [ ] Cores por status

---

#### ✅ Checklist Sub-Bloco 1.4
- [ ] Criar `/src/components/ui/toast.tsx`
- [ ] Criar useToast hook
- [ ] Criar ToastProvider
- [ ] Criar `/src/components/ui/tooltip.tsx`
- [ ] Criar `/src/components/ui/progress.tsx`
- [ ] Atualizar exports

---

### 📦 SUB-BLOCO 1.5: Command Palette & Extras
**Estimativa:** 8-10 horas | **Prioridade:** P1

#### Arquivos a Criar:
```
/src/components/ui/
├── command.tsx     # Cmd+K palette
├── avatar.tsx      # Avatar com fallback
└── stat-card.tsx   # Dashboard stat card
```

#### 1.5.1 — Command Palette
**Arquivo:** `/src/components/ui/command.tsx`

**Dependência:** `cmdk` library

**Features:**
- [ ] Atalho Cmd/Ctrl + K
- [ ] Busca global (páginas, clientes, ações)
- [ ] Categorias com ícones
- [ ] Recent searches
- [ ] Keyboard navigation (↑↓ Enter Esc)
- [ ] Fuzzy search

**Categorias:**
| Categoria | Ícone | Ações |
|-----------|-------|-------|
| Navegação | 🧭 | Dashboard, Inbox, Clientes... |
| Ações | ⚡ | Novo agendamento, Novo cliente... |
| Clientes | 👤 | Buscar por nome/telefone |
| Configurações | ⚙️ | Perfil, Integrações... |

---

#### 1.5.2 — Avatar Component
**Arquivo:** `/src/components/ui/avatar.tsx`

**Requisitos:**
- [ ] Imagem com fallback
- [ ] Iniciais como fallback
- [ ] Gradient background (brand)
- [ ] Status indicator (online/offline)
- [ ] 4 tamanhos (xs, sm, md, lg)
- [ ] Group (avatar stack)

---

#### 1.5.3 — Stat Card Component
**Arquivo:** `/src/components/ui/stat-card.tsx`

**Features:**
- [ ] useCountUp integrado
- [ ] Trend indicator (↑↓)
- [ ] Icon slot com gradient
- [ ] Sparkline opcional
- [ ] Loading skeleton
- [ ] Hover effect

---

#### ✅ Checklist Sub-Bloco 1.5
- [ ] Instalar cmdk: `npm install cmdk`
- [ ] Criar `/src/components/ui/command.tsx`
- [ ] Criar CommandProvider
- [ ] Criar `/src/components/ui/avatar.tsx`
- [ ] Criar `/src/components/ui/stat-card.tsx`
- [ ] Integrar Command no layout
- [ ] Atualizar exports finais

---

### 📋 Resumo BLOCO 1

| Sub-Bloco | Componentes | Estimativa | Status |
|-----------|-------------|------------|--------|
| 1.1 | Button, Badge, Skeleton | 6-8h | ⬜ |
| 1.2 | Input, Textarea, Select | 6-8h | ⬜ |
| 1.3 | Card, Dialog | 4-6h | ⬜ |
| 1.4 | Toast, Tooltip, Progress | 6-8h | ⬜ |
| 1.5 | Command, Avatar, StatCard | 8-10h | ⬜ |

**Total BLOCO 1:** ~32 horas  
**Impacto na nota:** +0.5  
**Prioridade:** CRÍTICO

---

## 🟢 BLOCO 2: MICROINTERAÇÕES & DELIGHT
### Objetivo: Utilizar Framer Motion ao máximo

### Dependências
- ✅ BLOCO 1 (componentes base)

---

### 📦 SUB-BLOCO 2.1: Números Animados
**Estimativa:** 4 horas | **Prioridade:** P0

#### Implementação:
Usar o hook `useCountUp` existente em `motion.tsx`

**Onde aplicar:**
- [ ] Dashboard: "Agendamentos Hoje"
- [ ] Dashboard: "Novos Clientes"  
- [ ] Dashboard: "Faturamento do Mês" (formatado R$)
- [ ] Dashboard: "Taxa de Conversão" (formatado %)
- [ ] Landing: Contador de clínicas
- [ ] Pricing: Valores dos planos

**Código exemplo:**
```tsx
const { ref, isInView } = useInView({ once: true });
const count = useCountUp(appointments, 600, isInView);

return <span ref={ref}>{count}</span>;
```

---

### 📦 SUB-BLOCO 2.2: Hover Effects Dramáticos
**Estimativa:** 6 horas | **Prioridade:** P0

#### Elementos a atualizar:

| Elemento | Efeito Atual | Novo Efeito |
|----------|--------------|-------------|
| Stat Cards | Sutil | Scale 1.02 + shadow lift + glow |
| Sidebar items | Background | Slide indicator + icon scale |
| Table rows | Nenhum | Background + left border |
| CTA buttons | Scale | Glow ring + brightness |
| Feature cards | Border | Float + shadow |

**Implementação:**
- [ ] Criar variants em `motion.tsx`
- [ ] Aplicar nos Stat Cards
- [ ] Aplicar na Sidebar
- [ ] Aplicar nas Tables (Inbox, Clients)
- [ ] Aplicar nos Buttons

---

### 📦 SUB-BLOCO 2.3: Success Animations
**Estimativa:** 6 horas | **Prioridade:** P0

#### Arquivo a criar:
`/src/components/ui/success-animation.tsx`

**Componentes:**
1. **AnimatedCheckmark** — SVG path animation
2. **Confetti** — Para achievements
3. **PulseRing** — Para confirmações sutis

**Onde usar:**
- [ ] Toast de sucesso
- [ ] Formulários enviados
- [ ] WhatsApp conectado
- [ ] Agendamento criado
- [ ] Onboarding steps completados

---

### 📦 SUB-BLOCO 2.4: Empty States & Loading
**Estimativa:** 8 horas | **Prioridade:** P0

#### Arquivo a criar:
`/src/components/ui/empty-state.tsx`

**Props Interface:**
```typescript
interface EmptyStateProps {
  type: 'inbox' | 'calendar' | 'clients' | 'generic';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Requisitos:**
- [ ] Ilustração por tipo (SVG ou Lottie)
- [ ] Copy emocional
- [ ] CTA contextual
- [ ] Animação de entrada

**Pages a atualizar:**
- [ ] Dashboard (sem agendamentos)
- [ ] Inbox (sem conversas)
- [ ] Clientes (lista vazia)
- [ ] Agendamentos (calendário vazio)
- [ ] Produtos (sem produtos)

**Skeleton screens:**
- [ ] Dashboard skeleton
- [ ] Inbox skeleton
- [ ] Clients list skeleton
- [ ] Settings skeleton

---

### 📋 Resumo BLOCO 2

| Sub-Bloco | Foco | Estimativa | Status |
|-----------|------|------------|--------|
| 2.1 | Números animados | 4h | ⬜ |
| 2.2 | Hover effects | 6h | ⬜ |
| 2.3 | Success animations | 6h | ⬜ |
| 2.4 | Empty states & loading | 8h | ⬜ |

**Total BLOCO 2:** ~24 horas  
**Impacto na nota:** +0.4  
**Prioridade:** CRÍTICO

---

## 🟡 BLOCO 3: LANDING PAGE PREMIUM
### Objetivo: Converter visitantes com "wow factor"

### Dependências
- ✅ BLOCO 1 (componentes)
- ✅ BLOCO 2.3 (animations)

---

### 📦 SUB-BLOCO 3.1: Hero Section
**Estimativa:** 8 horas | **Prioridade:** P0

**Arquivo atual:** `/src/app/page.tsx` (seção Hero)

**Melhorias:**

1. **Background animado:**
   - [ ] Gradient mesh sutil
   - [ ] Particles (opcional, performance-aware)
   - [ ] Noise texture
   - [ ] Glow orbs animados

2. **Entrada staggered:**
   ```
   1. Badge "Novo" (0ms)
   2. Título (100ms)
   3. Descrição (200ms)
   4. CTAs (300ms)
   5. Trust badges (400ms)
   6. Mockup (500ms)
   ```

3. **Mockup interativo:**
   - [ ] Hover highlights nos cards
   - [ ] Tooltips mostrando features
   - [ ] Números animando
   - [ ] Cursor customizado no hover

---

### 📦 SUB-BLOCO 3.2: Features & How It Works
**Estimativa:** 8 horas | **Prioridade:** P1

**Melhorias Features:**
- [ ] Cards com entrada staggered
- [ ] Ícones animados no hover
- [ ] Gradient accent nas bordas
- [ ] Expandable details (accordion)

**Criar seção "Como Funciona":**
- [ ] 3 steps animados
- [ ] Linha conectando (SVG animated)
- [ ] Número do step com count animation
- [ ] Mockups contextuais por step

---

### 📦 SUB-BLOCO 3.3: Social Proof
**Estimativa:** 8 horas | **Prioridade:** P1

**Testimonials:**
- [ ] Carousel com auto-play
- [ ] Fotos reais ou avatares ilustrados
- [ ] Rating com estrelas animadas
- [ ] Quote marks decorativas
- [ ] Fade in/out smooth

**Live counter:**
```tsx
<div className="flex items-center gap-2">
  <AnimatedNumber value={523} duration={2000} />
  <span>clínicas confiam no NexaCore</span>
</div>
```

**Trust badges section:**
- [ ] LGPD Compliant
- [ ] Dados criptografados
- [ ] Uptime 99.9%

---

### 📦 SUB-BLOCO 3.4: Pricing & CTA Final
**Estimativa:** 8 horas | **Prioridade:** P1

**Pricing improvements:**
- [ ] Badge "Mais Popular" no plano médio
- [ ] Hover effect com glow
- [ ] Toggle mensal/anual com economia
- [ ] Checkmarks animados nos features
- [ ] Tooltip nos features avançados

**CTA Final:**
- [ ] Background hero gradient
- [ ] Texto maior, mais urgente
- [ ] Trust badges inline
- [ ] Animação de entrada ao scroll

**Footer completo:**
- [ ] Newsletter signup com feedback
- [ ] Links organizados
- [ ] Social icons com hover
- [ ] Copyright dinâmico

---

### 📋 Resumo BLOCO 3

| Sub-Bloco | Foco | Estimativa | Status |
|-----------|------|------------|--------|
| 3.1 | Hero Section | 8h | ⬜ |
| 3.2 | Features & How It Works | 8h | ⬜ |
| 3.3 | Social Proof | 8h | ⬜ |
| 3.4 | Pricing & CTA Final | 8h | ⬜ |

**Total BLOCO 3:** ~32 horas  
**Impacto na nota:** +0.4  
**Prioridade:** ALTO

---

## 🟠 BLOCO 4: DASHBOARD EVOLUTION
### Objetivo: Visualização de dados e insights acionáveis

### Dependências
- ✅ BLOCO 1.5 (stat-card)
- ✅ BLOCO 2 (animations)
- 📦 Recharts (já instalado)

---

### 📦 SUB-BLOCO 4.1: Revenue Chart
**Estimativa:** 10 horas | **Prioridade:** P0

**Arquivo a criar:**  
`/src/components/dashboard/revenue-chart.tsx`

**Features:**
- [ ] Line/Area chart (Recharts)
- [ ] Tooltip customizado (glass style)
- [ ] Período selecionável (7d, 30d, 90d, 1y)
- [ ] Comparação com período anterior
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Responsive

**Design:**
- Gradiente verde para valores positivos
- Linha suave com area fill
- Grid lines sutis
- Animação de entrada

---

### 📦 SUB-BLOCO 4.2: Stat Cards Enhanced
**Estimativa:** 8 horas | **Prioridade:** P0

**Melhorias no stat-card.tsx:**
- [ ] Sparkline de 7 dias (mini gráfico)
- [ ] Cor da sparkline baseada na tendência
- [ ] Hover para ver valor específico
- [ ] Click para drill-down (modal com detalhes)

**API endpoint necessário:**
`/api/dashboard/stats-history`

---

### 📦 SUB-BLOCO 4.3: AI Widget & Quick Actions
**Estimativa:** 12 horas | **Prioridade:** P1

**Arquivo a criar:**  
`/src/components/dashboard/ai-widget.tsx`

**AI Widget Features:**
- [ ] Floating widget (canto inferior direito)
- [ ] Collapsed: badge com count de sugestões
- [ ] Expanded: lista de sugestões do AI
- [ ] Quick actions (responder, agendar, ignorar)
- [ ] Animação expand/collapse

**Quick Actions contextuais:**
- [ ] Baseado no horário (manhã: "Ver agenda de hoje")
- [ ] Baseado no dia (segunda: "Revisar semana")
- [ ] Baseado em dados (leads quentes: "3 leads aguardando")
- [ ] Atalhos de teclado

---

### 📦 SUB-BLOCO 4.4: Notification Center
**Estimativa:** 10 horas | **Prioridade:** P1

**Arquivo a criar:**  
`/src/components/dashboard/notification-center.tsx`

**Features:**
- [ ] Dropdown no header (bell icon)
- [ ] Lista de notificações recentes
- [ ] Mark as read/unread
- [ ] Categorias (sistema, clientes, AI)
- [ ] Badge com count de não lidas
- [ ] Sound toggle
- [ ] "Mark all as read"
- [ ] Link para notificação específica

---

### 📋 Resumo BLOCO 4

| Sub-Bloco | Foco | Estimativa | Status |
|-----------|------|------------|--------|
| 4.1 | Revenue Chart | 10h | ⬜ |
| 4.2 | Stat Cards Enhanced | 8h | ⬜ |
| 4.3 | AI Widget & Quick Actions | 12h | ⬜ |
| 4.4 | Notification Center | 10h | ⬜ |

**Total BLOCO 4:** ~40 horas  
**Impacto na nota:** +0.5  
**Prioridade:** ALTO

---

## 🔴 BLOCO 5: ONBOARDING & POLISH
### Objetivo: Guiar first-time users

### Dependências
- ✅ Todos os blocos anteriores

---

### 📦 SUB-BLOCO 5.1: Onboarding Tour
**Estimativa:** 10 horas | **Prioridade:** P1

**Dependência:** `react-joyride` ou similar

**Tour Steps:**
1. Welcome modal com vídeo curto (30s)
2. Highlight do Dashboard overview
3. Tour pela Inbox
4. Configuração do WhatsApp
5. Criar primeiro serviço
6. Primeiro agendamento
7. Celebração de conclusão (confetti!)

**Features:**
- [ ] Skip option
- [ ] Progress indicator
- [ ] Persistent (localStorage)
- [ ] Re-trigger em settings

---

### 📦 SUB-BLOCO 5.2: Setup Checklist
**Estimativa:** 8 horas | **Prioridade:** P1

**Arquivo a criar:**  
`/src/components/dashboard/setup-checklist.tsx`

**Checklist items:**
- [ ] Completar perfil da clínica
- [ ] Conectar WhatsApp
- [ ] Adicionar primeiro serviço
- [ ] Adicionar primeiro profissional
- [ ] Criar primeiro agendamento
- [ ] Ativar AI Assistant

**Features:**
- [ ] Progress bar visual
- [ ] Cada item expandível com guia
- [ ] Reward ao completar (confetti)
- [ ] Dismiss quando 100%
- [ ] Badge de "Setup completo"

---

### 📦 SUB-BLOCO 5.3: Keyboard Shortcuts
**Estimativa:** 6 horas | **Prioridade:** P2

**Shortcuts a implementar:**

| Shortcut | Ação |
|----------|------|
| `Cmd/Ctrl + K` | Command palette |
| `Cmd/Ctrl + N` | Novo agendamento |
| `Cmd/Ctrl + /` | Help (lista de atalhos) |
| `Esc` | Fechar modais/dialogs |
| `↑↓` | Navegar listas |
| `Enter` | Selecionar item |
| `G + D` | Go to Dashboard |
| `G + I` | Go to Inbox |
| `G + C` | Go to Clientes |

**Implementação:**
- [ ] Hook `useKeyboardShortcuts`
- [ ] Integrar com Command Palette
- [ ] Help modal com todos os atalhos
- [ ] Tooltips mostrando atalhos

---

### 📋 Resumo BLOCO 5

| Sub-Bloco | Foco | Estimativa | Status |
|-----------|------|------------|--------|
| 5.1 | Onboarding Tour | 10h | ⬜ |
| 5.2 | Setup Checklist | 8h | ⬜ |
| 5.3 | Keyboard Shortcuts | 6h | ⬜ |

**Total BLOCO 5:** ~24 horas  
**Impacto na nota:** +0.3  
**Prioridade:** MÉDIO

---

## 📁 ESTRUTURA FINAL DE ARQUIVOS

```
/src/components/
├── ui/
│   ├── index.tsx           # Barrel exports (atualizar)
│   ├── motion.tsx          # ✅ Existente
│   │
│   │── # BLOCO 1.1
│   ├── button.tsx          # ⬜ Criar
│   ├── badge.tsx           # ⬜ Criar
│   ├── skeleton.tsx        # ⬜ Criar
│   │
│   │── # BLOCO 1.2
│   ├── input.tsx           # ⬜ Criar
│   ├── textarea.tsx        # ⬜ Criar
│   ├── select.tsx          # ⬜ Criar
│   │
│   │── # BLOCO 1.3
│   ├── card.tsx            # ⬜ Criar
│   ├── dialog.tsx          # ⬜ Criar
│   │
│   │── # BLOCO 1.4
│   ├── toast.tsx           # ⬜ Criar
│   ├── tooltip.tsx         # ⬜ Criar
│   ├── progress.tsx        # ⬜ Criar
│   │
│   │── # BLOCO 1.5
│   ├── command.tsx         # ⬜ Criar
│   ├── avatar.tsx          # ⬜ Criar
│   ├── stat-card.tsx       # ⬜ Criar
│   │
│   │── # BLOCO 2
│   ├── success-animation.tsx  # ⬜ Criar
│   └── empty-state.tsx        # ⬜ Criar
│
├── dashboard/
│   ├── revenue-chart.tsx      # ⬜ Criar (4.1)
│   ├── ai-widget.tsx          # ⬜ Criar (4.3)
│   ├── notification-center.tsx # ⬜ Criar (4.4)
│   ├── setup-checklist.tsx    # ⬜ Criar (5.2)
│   └── quick-actions.tsx      # ⬜ Criar (4.3)
│
├── landing/                   # ⬜ Criar pasta (BLOCO 3)
│   ├── hero.tsx
│   ├── features.tsx
│   ├── how-it-works.tsx
│   ├── testimonials.tsx
│   ├── pricing.tsx
│   └── cta-section.tsx
│
└── onboarding/               # ⬜ Criar pasta (BLOCO 5)
    ├── tour.tsx
    └── welcome-modal.tsx
```

---

## 📈 MÉTRICAS DE SUCESSO

### Por Bloco

| Bloco | Métrica | Antes | Depois |
|-------|---------|-------|--------|
| 1 | Consistência UI | 60% | 95% |
| 2 | Engagement visual | 70% | 90% |
| 3 | Conversion rate | baseline | +20% |
| 4 | Data visibility | 40% | 80% |
| 5 | Onboarding completion | 0% | 80% |

### UX KPIs Gerais

| Métrica | Atual | Meta |
|---------|-------|------|
| Time to First Interaction | ~3s | <1s |
| Feature Discovery | ~40% | >70% |
| User Satisfaction (NPS) | ? | >50 |
| Task Completion Rate | ~75% | >90% |

### Performance

| Métrica | Meta |
|---------|------|
| First Contentful Paint | <1.0s |
| Largest Contentful Paint | <2.0s |
| Cumulative Layout Shift | <0.1 |
| Total Blocking Time | <200ms |

---

## 🚦 ORDEM DE EXECUÇÃO RECOMENDADA

```
SEMANA 1-2:
├── 1.1 Componentes Fundamentais (Button, Badge, Skeleton)
├── 1.2 Formulários (Input, Textarea, Select)
└── 1.3 Containers (Card, Dialog)

SEMANA 3:
├── 1.4 Feedback (Toast, Tooltip, Progress)
├── 1.5 Extras (Command, Avatar, StatCard)
└── 2.1 Números Animados

SEMANA 4:
├── 2.2 Hover Effects
├── 2.3 Success Animations
└── 2.4 Empty States & Loading

SEMANA 5-6:
├── 3.1 Hero Section
├── 3.2 Features & How It Works
├── 3.3 Social Proof
└── 3.4 Pricing & CTA

SEMANA 7-8:
├── 4.1 Revenue Chart
├── 4.2 Stat Cards Enhanced
├── 4.3 AI Widget
└── 4.4 Notification Center

SEMANA 9-10:
├── 5.1 Onboarding Tour
├── 5.2 Setup Checklist
└── 5.3 Keyboard Shortcuts
```

---

## 🎯 PRÓXIMO PASSO

### INICIAR PELO SUB-BLOCO 1.1

**Primeiro arquivo:** `/src/components/ui/button.tsx`

Confirme e iniciamos a implementação do Button Component com todas as variantes!

---

**Legenda de Status:**
- ⬜ Não iniciado
- 🔄 Em progresso
- ✅ Concluído
- ⏸️ Pausado
