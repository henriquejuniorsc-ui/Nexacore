"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DURATION, EASE } from "./motion";

/* ================================================================
   NEXACORE BADGE COMPONENT v4.0
   
   Research-backed design decisions:
   ─ Semantic colors for instant recognition
   ─ Pulse animation for notifications (attention capture)
   ─ Dot indicator for compact status display
   ─ Removable tags for flexibility
   ================================================================ */

const badgeVariants = cva(
  `
    inline-flex items-center justify-center gap-1.5
    font-medium transition-colors
    whitespace-nowrap
  `,
  {
    variants: {
      variant: {
        // Default neutral
        default: "bg-white/10 text-text-secondary border border-white/10",
        // Semantic variants
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        error: "bg-error/10 text-error border border-error/20",
        info: "bg-info/10 text-info border border-info/20",
        // Brand variants
        primary: "bg-cta/10 text-cta border border-cta/20",
        brand: "bg-gradient-to-r from-brand-pink/10 to-brand-orange/10 text-brand-pink border border-brand-pink/20",
        // Solid variants (more emphasis)
        "solid-success": "bg-success text-white",
        "solid-warning": "bg-warning text-black",
        "solid-error": "bg-error text-white",
        "solid-info": "bg-info text-white",
        "solid-primary": "bg-cta text-cta-text",
        // Outline variants
        outline: "bg-transparent border border-white/20 text-text-secondary",
        "outline-success": "bg-transparent border border-success/40 text-success",
        "outline-error": "bg-transparent border border-error/40 text-error",
      },
      size: {
        xs: "text-[10px] px-1.5 py-0.5 rounded",
        sm: "text-xs px-2 py-0.5 rounded-md",
        md: "text-sm px-2.5 py-1 rounded-md",
        lg: "text-sm px-3 py-1.5 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

// ─── Types ───
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show dot indicator */
  dot?: boolean;
  /** Dot color (overrides variant color) */
  dotColor?: string;
  /** Make badge removable */
  removable?: boolean;
  /** Callback when remove button clicked */
  onRemove?: () => void;
  /** Show pulse animation (for notifications) */
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      dot,
      dotColor,
      removable,
      onRemove,
      pulse,
      children,
      ...props
    },
    ref
  ) => {
    // Determine dot color based on variant
    const getDotColor = () => {
      if (dotColor) return dotColor;
      if (variant?.includes("success")) return "bg-success";
      if (variant?.includes("warning")) return "bg-warning";
      if (variant?.includes("error")) return "bg-error";
      if (variant?.includes("info")) return "bg-info";
      if (variant?.includes("primary")) return "bg-cta";
      if (variant?.includes("brand")) return "bg-brand-pink";
      return "bg-text-secondary";
    };

    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ variant, size }),
          "relative",
          className
        )}
        {...props}
      >
        {/* Pulse animation for notifications */}
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
          </span>
        )}

        {/* Dot indicator */}
        {dot && (
          <span
            className={cn("w-1.5 h-1.5 rounded-full shrink-0", getDotColor())}
          />
        )}

        {children}

        {/* Remove button */}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="ml-1 -mr-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);
Badge.displayName = "Badge";

// ─── Animated Badge (with entrance animation) ───
export interface AnimatedBadgeProps extends BadgeProps {
  /** Animation delay (for staggered entrance) */
  delay?: number;
}

const AnimatedBadge = React.forwardRef<HTMLSpanElement, AnimatedBadgeProps>(
  ({ delay = 0, ...props }, ref) => {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          duration: DURATION.normal,
          ease: EASE.spring,
          delay,
        }}
      >
        <Badge ref={ref} {...props} />
      </motion.span>
    );
  }
);
AnimatedBadge.displayName = "AnimatedBadge";

// ─── Status Badge (with predefined colors) ───
export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "cancelled"
  | "draft"
  | "hot"
  | "warm"
  | "cold"
  | "online"
  | "offline"
  | "away";

const statusConfig: Record<
  StatusType,
  { variant: BadgeProps["variant"]; label: string; dot?: boolean }
> = {
  active: { variant: "success", label: "Ativo", dot: true },
  inactive: { variant: "default", label: "Inativo", dot: true },
  pending: { variant: "warning", label: "Pendente", dot: true },
  completed: { variant: "success", label: "Concluído" },
  cancelled: { variant: "error", label: "Cancelado" },
  draft: { variant: "default", label: "Rascunho" },
  hot: { variant: "solid-error", label: "Quente" },
  warm: { variant: "warning", label: "Morno" },
  cold: { variant: "info", label: "Frio" },
  online: { variant: "success", label: "Online", dot: true },
  offline: { variant: "default", label: "Offline", dot: true },
  away: { variant: "warning", label: "Ausente", dot: true },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  status: StatusType;
  /** Override the default label */
  label?: string;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, label, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        dot={config.dot}
        {...props}
      >
        {label || config.label}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

// ─── Count Badge (notification count) ───
export interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
  /** Show badge even when count is 0 */
  showZero?: boolean;
}

const CountBadge = React.forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ count, max = 99, showZero = false, className }, ref) => {
    if (count === 0 && !showZero) return null;

    const displayCount = count > max ? `${max}+` : count;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          "min-w-[18px] h-[18px] px-1.5 rounded-full",
          "text-[10px] font-bold",
          "bg-error text-white",
          className
        )}
      >
        {displayCount}
      </span>
    );
  }
);
CountBadge.displayName = "CountBadge";

// ─── Tag (colorful, removable) ───
export interface TagProps extends Omit<BadgeProps, "variant"> {
  /** Custom background color */
  color?: string;
  /** Custom text color */
  textColor?: string;
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ color, textColor, className, style, ...props }, ref) => {
    const customStyle = {
      ...style,
      ...(color && { backgroundColor: color }),
      ...(textColor && { color: textColor }),
    };

    return (
      <Badge
        ref={ref}
        variant="default"
        className={cn(color && "border-transparent", className)}
        style={customStyle}
        {...props}
      />
    );
  }
);
Tag.displayName = "Tag";

// ─── Exports ───
export {
  Badge,
  AnimatedBadge,
  StatusBadge,
  CountBadge,
  Tag,
  badgeVariants,
};
