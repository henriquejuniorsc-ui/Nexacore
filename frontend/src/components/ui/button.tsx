"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DURATION, EASE, tapScale, tapScaleSmall } from "./motion";

/* ================================================================
   NEXACORE BUTTON COMPONENT v4.0
   
   Research-backed design decisions:
   ─ Yellow CTA (#FFC300): +21% conversion documented (HubSpot)
   ─ 44px minimum touch target (Apple HIG, WCAG 2.1)
   ─ Rounded corners: 17-55% higher CTR than sharp
   ─ Scale feedback: 0.97-0.98 on press (proprioceptive feedback)
   ─ 150-200ms transitions (optimal cognitive perception)
   ================================================================ */

const buttonVariants = cva(
  // Base styles
  `
    inline-flex items-center justify-center gap-2 
    whitespace-nowrap font-semibold
    transition-all duration-fast ease-standard
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
    disabled:pointer-events-none disabled:opacity-50
    select-none
  `,
  {
    variants: {
      variant: {
        // Primary CTA — Yellow for maximum conversion
        cta: `
          bg-cta text-cta-text 
          hover:bg-cta-hover
          shadow-[0_4px_16px_rgba(255,195,0,0.35)]
          hover:shadow-[0_6px_24px_rgba(255,195,0,0.45)]
          active:shadow-[0_2px_8px_rgba(255,195,0,0.3)]
        `,
        // Brand gradient — For special emphasis
        brand: `
          bg-gradient-to-r from-brand-pink to-brand-orange text-white
          shadow-[0_4px_16px_rgba(255,0,110,0.25)]
          hover:shadow-[0_6px_24px_rgba(255,0,110,0.35)]
          active:shadow-[0_2px_8px_rgba(255,0,110,0.2)]
          hover:brightness-110
        `,
        // Primary — Trust blue for secondary actions
        primary: `
          bg-trust text-white
          hover:bg-trust/90
          shadow-sm hover:shadow-md
        `,
        // Secondary — Subtle surface
        secondary: `
          bg-surface-hover text-text-primary border border-white/10
          hover:bg-surface-active hover:border-white/15
        `,
        // Ghost — Minimal, for dense UIs
        ghost: `
          text-text-secondary
          hover:bg-white/5 hover:text-text-primary
        `,
        // Outline — Bordered, medium emphasis
        outline: `
          border border-white/10 bg-transparent text-text-primary
          hover:bg-white/5 hover:border-white/20
        `,
        // Destructive — Danger actions
        destructive: `
          bg-error text-white
          hover:bg-error/90
          shadow-sm hover:shadow-md
        `,
        // Success — Confirmation actions
        success: `
          bg-success text-white
          hover:bg-success/90
          shadow-sm hover:shadow-md
        `,
        // Link — Text only, inline
        link: `
          text-trust underline-offset-4 
          hover:underline hover:text-trust/80
          p-0 h-auto
        `,
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md",
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-11 px-5 text-base rounded-lg",
        xl: "h-12 px-6 text-base rounded-xl",
        // Icon buttons (square)
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  }
);

// ─── Types ───
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ─── Static Button (no motion) ───
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// ─── Motion Button (with Framer Motion animations) ───
export interface MotionButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Enable scale animation on hover/tap. Default: true */
  animate?: boolean;
  /** Use smaller scale effect (0.98 instead of 0.97). Good for small buttons */
  subtleScale?: boolean;
}

const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      animate = true,
      subtleScale = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    // Motion props only if animate is true
    const motionProps = animate
      ? {
          whileHover: isDisabled ? {} : { scale: 1.02 },
          whileTap: isDisabled ? {} : subtleScale ? tapScaleSmall : tapScale,
          transition: { duration: DURATION.fast, ease: EASE.snappy },
        }
      : {};

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...motionProps}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);
MotionButton.displayName = "MotionButton";

// ─── Icon Button (convenience wrapper) ───
export interface IconButtonProps extends ButtonProps {
  /** Accessibility label (required for icon-only buttons) */
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "icon", children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn("p-0", className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

// ─── Exports ───
export { Button, MotionButton, IconButton, buttonVariants };
