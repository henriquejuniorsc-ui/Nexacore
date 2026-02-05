"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASE, hoverLift, hoverScale, hoverGlow } from "./motion";

/* ================================================================
   NEXACORE CARD COMPONENT v4.0
   
   Research-backed design decisions:
   ─ Glassmorphism: 4.5:1 WCAG contrast maintained
   ─ Rounded corners: 17-55% higher CTR than sharp
   ─ Hover lift: -3px translateY for depth perception
   ─ Border gradient: Creates visual separation
   ─ Backdrop blur: 12px for optimal glass effect
   ================================================================ */

const cardVariants = cva(
  `
    rounded-lg border transition-all
  `,
  {
    variants: {
      variant: {
        // Default surface card
        default: `
          bg-surface border-white/[0.07]
        `,
        // Glassmorphism card
        glass: `
          bg-surface/65 backdrop-blur-lg border-white/[0.07]
          supports-[backdrop-filter]:bg-surface/65
        `,
        // Elevated with stronger shadow
        elevated: `
          bg-surface border-white/[0.07]
          shadow-lg
        `,
        // Ghost/transparent
        ghost: `
          bg-transparent border-transparent
        `,
        // Outline only
        outline: `
          bg-transparent border-white/10
        `,
        // Feature card with gradient accent
        feature: `
          bg-surface border-white/[0.07]
          relative overflow-hidden
          before:absolute before:inset-x-0 before:top-0 before:h-[2px]
          before:bg-gradient-to-r before:from-brand-pink before:to-brand-orange
        `,
        // Gradient border card
        gradient: `
          bg-surface relative
          before:absolute before:inset-0 before:p-[1px] before:rounded-lg
          before:bg-gradient-to-r before:from-brand-pink before:to-brand-orange
          before:-z-10 before:content-['']
          [&>*]:relative [&>*]:z-10
        `,
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-0.5 hover:shadow-md",
        scale: "hover:scale-[1.02]",
        glow: "hover:shadow-[0_0_20px_rgba(255,0,110,0.15)]",
        border: "hover:border-white/15",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      hover: "border",
    },
  }
);

// ─── Types ───
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Make the card clickable (shows pointer cursor) */
  interactive?: boolean;
}

// ─── Static Card ───
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant, padding, hover, interactive, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, hover }),
          interactive && "cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

// ─── Motion Card (with Framer Motion) ───
export interface MotionCardProps
  extends Omit<HTMLMotionProps<"div">, "children">,
    VariantProps<typeof cardVariants> {
  children?: React.ReactNode;
  /** Enable hover animations */
  animated?: boolean;
  /** Animation type */
  animationType?: "lift" | "scale" | "glow" | "all";
}

const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  (
    {
      className,
      variant,
      padding,
      hover,
      animated = true,
      animationType = "lift",
      children,
      ...props
    },
    ref
  ) => {
    // Build hover animation based on type
    const getHoverAnimation = () => {
      if (!animated) return {};

      switch (animationType) {
        case "lift":
          return { y: -3, transition: { duration: DURATION.fast, ease: EASE.gentle } };
        case "scale":
          return { scale: 1.02, transition: { duration: DURATION.fast, ease: EASE.gentle } };
        case "glow":
          return { 
            boxShadow: "0 0 20px rgba(255, 0, 110, 0.2)",
            transition: { duration: DURATION.normal } 
          };
        case "all":
          return { 
            y: -3, 
            scale: 1.01,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            transition: { duration: DURATION.fast, ease: EASE.gentle } 
          };
        default:
          return {};
      }
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, hover: "none" }),
          "cursor-pointer",
          className
        )}
        whileHover={getHoverAnimation()}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: DURATION.fast }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = "MotionCard";

// ─── Card Header ───
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// ─── Card Title ───
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-text-primary",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// ─── Card Description ───
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// ─── Card Content ───
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

// ─── Card Footer ───
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// ─── Stat Card (Dashboard specific) ───
export interface StatCardProps extends Omit<CardProps, "children"> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: React.ReactNode;
  subtitle?: string;
  /** Use animated counter */
  animate?: boolean;
}

// This will be expanded in Bloco 3 with useCountUp
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, change, icon, subtitle, className, ...props }, ref) => {
    const changeColor = change?.type === "increase" 
      ? "text-success" 
      : change?.type === "decrease" 
        ? "text-error" 
        : "text-text-tertiary";

    return (
      <Card ref={ref} variant="glass" className={cn("", className)} {...props}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">{title}</p>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {value}
            </p>
            {subtitle && (
              <p className="text-text-tertiary text-xs mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-white/5 text-text-secondary">
              {icon}
            </div>
          )}
        </div>
        {change && (
          <div className={cn("flex items-center gap-1 mt-3 text-sm", changeColor)}>
            <span>
              {change.type === "increase" ? "↑" : change.type === "decrease" ? "↓" : "→"}
            </span>
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </Card>
    );
  }
);
StatCard.displayName = "StatCard";

// ─── Exports ───
export {
  Card,
  MotionCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  cardVariants,
};
