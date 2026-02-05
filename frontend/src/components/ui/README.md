# NexaCore UI Component Library v4.0

A research-backed React component library built with TypeScript, Tailwind CSS, Framer Motion, and Radix UI primitives.

## 📚 Components

### Core Components

| Component | Description | Status |
|-----------|-------------|--------|
| **Button** | CTA, brand, primary, secondary, ghost, outline, destructive | ✅ Complete |
| **Input** | Text, password, search with validation and error states | ✅ Complete |
| **Card** | Default, glass, elevated, feature, gradient border | ✅ Complete |
| **Badge** | Status, count, tags with semantic colors | ✅ Complete |
| **Skeleton** | Loading states for all common patterns | ✅ Complete |
| **Tooltip** | Simple, keyboard shortcut, info variants | ✅ Complete |
| **Dialog** | Modal, confirm, alert dialogs | ✅ Complete |
| **Avatar** | Image, initials, status indicator, groups | ✅ Complete |
| **Progress** | Linear, circular, step progress | ✅ Complete |

### Motion System

Pre-configured animations respecting `prefers-reduced-motion`:

- **Duration constants**: instant (50ms) → complex (400ms)
- **Easing curves**: Material Design 3 standard curves
- **Spring configs**: gentle, snappy, bouncy, smooth
- **Variants**: fadeIn, scaleIn, slideIn, stagger
- **Components**: FadeInView, ScaleInView, StaggerContainer, PageTransition

## 🎨 Design Principles

Based on extensive UX research documented in the codebase:

1. **8-point Grid System** — Material Design 3 / Apple HIG standard
2. **Major Third Typography** — 1.25 scale for B2B SaaS data-dense interfaces
3. **WCAG 2.1 AAA Compliance** — 7:1+ contrast for primary text
4. **100-300ms Animation Timing** — Cognitive psychology optimal range
5. **44px Touch Targets** — Apple HIG / WCAG 2.1 minimum
6. **Yellow CTA (#FFC300)** — +21% conversion documented (HubSpot)

## 📦 Usage

```tsx
import {
  Button,
  Card,
  Badge,
  Avatar,
  Tooltip,
  Progress,
  // ... other components
} from "@/components/ui";

function MyComponent() {
  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center gap-3">
        <Avatar name="John Doe" status="online" />
        <div>
          <h3>Welcome back!</h3>
          <Badge variant="success">Active</Badge>
        </div>
      </div>
      <Button variant="cta" className="mt-4">
        Get Started
      </Button>
    </Card>
  );
}
```

## 🎬 Motion Components

```tsx
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
  useCountUp,
} from "@/components/ui";

function AnimatedList() {
  const count = useCountUp(1000, 800);

  return (
    <StaggerContainer>
      <StaggerItem>Item 1</StaggerItem>
      <StaggerItem>Item 2</StaggerItem>
      <StaggerItem>Item 3</StaggerItem>
      <p>Count: {count}</p>
    </StaggerContainer>
  );
}
```

## 🔧 Customization

All components use Tailwind CSS classes and CSS custom properties from the design system:

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --radius-lg: 12px;
  /* ... see globals.css for full list */
}
```

## 🧪 Testing

Components are designed for testing with:
- React Testing Library
- Vitest
- Accessibility testing with axe-core

## 📁 File Structure

```
src/components/ui/
├── index.tsx          # Barrel exports
├── types.ts           # Shared TypeScript types
├── motion.tsx         # Animation system
├── button.tsx         # Button component
├── input.tsx          # Input, Textarea, Label
├── card.tsx           # Card variants
├── badge.tsx          # Badge, Status, Tag
├── skeleton.tsx       # Loading skeletons
├── tooltip.tsx        # Tooltip variants
├── dialog.tsx         # Modal, Confirm, Alert
├── avatar.tsx         # Avatar, AvatarGroup
├── progress.tsx       # Progress indicators
└── README.md          # This file
```

## 📖 Research References

Design decisions are backed by research from:
- Nielsen Norman Group (eye-tracking, F-pattern)
- Material Design 3 (easing curves, elevation)
- Apple Human Interface Guidelines (touch targets)
- WCAG 2.1 (accessibility requirements)
- Baymard Institute (form optimization)
- Stack Overflow Developer Surveys (dark mode preference)

---

**Version**: 4.0.0  
**License**: Proprietary  
**Maintainer**: NexaCore Team
