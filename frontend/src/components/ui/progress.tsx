"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASE } from "./motion";

/* ================================================================
   NEXACORE PROGRESS COMPONENT v4.0
   
   Research-backed design decisions:
   ─ Progress bars reduce perceived wait time by 20%
   ─ Animated indicators show system activity
   ─ Brand gradient for visual consistency
   ─ Accessible ARIA attributes
   ================================================================ */

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-white/10",
  {
    variants: {
      size: {
        xs: "h-1",
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// ─── Linear Progress ───
export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  /** Progress value (0-100) */
  value?: number;
  /** Show indeterminate animation */
  indeterminate?: boolean;
  /** Color variant */
  variant?: "default" | "success" | "warning" | "error" | "brand";
  /** Show percentage label */
  showLabel?: boolean;
  /** Animate value changes */
  animated?: boolean;
}

const variantColors = {
  default: "bg-cta",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  brand: "bg-gradient-to-r from-brand-pink to-brand-orange",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      size,
      indeterminate = false,
      variant = "default",
      showLabel = false,
      animated = true,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div className="w-full">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size }), className)}
          value={clampedValue}
          {...props}
        >
          {indeterminate ? (
            // Indeterminate animation
            <div className="h-full w-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full w-1/3 rounded-full",
                  variantColors[variant]
                )}
                animate={{
                  x: ["-100%", "400%"],
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
            </div>
          ) : (
            <ProgressPrimitive.Indicator
              className={cn(
                "h-full rounded-full transition-all",
                animated && "duration-300 ease-out",
                variantColors[variant]
              )}
              style={{ width: `${clampedValue}%` }}
            />
          )}
        </ProgressPrimitive.Root>

        {showLabel && !indeterminate && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-text-secondary tabular-nums">
              {Math.round(clampedValue)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

// ─── Circular Progress ───
export interface CircularProgressProps {
  /** Progress value (0-100) */
  value?: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show indeterminate animation */
  indeterminate?: boolean;
  /** Color variant */
  variant?: "default" | "success" | "warning" | "error" | "brand";
  /** Show percentage in center */
  showLabel?: boolean;
  /** Custom content in center */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

const strokeColors = {
  default: "stroke-cta",
  success: "stroke-success",
  warning: "stroke-warning",
  error: "stroke-error",
  brand: "stroke-brand-pink",
};

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  (
    {
      value = 0,
      size = 40,
      strokeWidth = 4,
      indeterminate = false,
      variant = "default",
      showLabel = false,
      children,
      className,
    },
    ref
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (clampedValue / 100) * circumference;

    return (
      <div
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={cn(
            "transform -rotate-90",
            indeterminate && "animate-spin"
          )}
          style={indeterminate ? { animationDuration: "1.5s" } : undefined}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/10"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
            className={cn(
              "transition-all duration-300 ease-out",
              strokeColors[variant]
            )}
          />
        </svg>

        {/* Center content */}
        {(showLabel || children) && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children || (
              <span className="text-xs font-medium text-text-primary tabular-nums">
                {Math.round(clampedValue)}%
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

// ─── Step Progress ───
export interface StepProgressProps {
  /** Total number of steps */
  steps: number;
  /** Current step (1-indexed) */
  currentStep: number;
  /** Step labels */
  labels?: string[];
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Orientation */
  orientation?: "horizontal" | "vertical";
  /** Additional className */
  className?: string;
}

const stepSizes = {
  sm: { dot: "w-6 h-6 text-xs", connector: "h-0.5" },
  md: { dot: "w-8 h-8 text-sm", connector: "h-0.5" },
  lg: { dot: "w-10 h-10 text-base", connector: "h-1" },
};

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  (
    {
      steps,
      currentStep,
      labels,
      size = "md",
      orientation = "horizontal",
      className,
    },
    ref
  ) => {
    const sizeConfig = stepSizes[size];
    const isVertical = orientation === "vertical";

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          isVertical ? "flex-col" : "flex-row items-center",
          className
        )}
      >
        {Array.from({ length: steps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = stepNumber === steps;

          return (
            <React.Fragment key={stepNumber}>
              <div className={cn("flex items-center", isVertical && "flex-row")}>
                {/* Step dot/number */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? "rgb(16, 185, 129)"
                      : isCurrent
                      ? "rgb(255, 195, 0)"
                      : "rgba(255, 255, 255, 0.1)",
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-full font-medium",
                    sizeConfig.dot,
                    isCompleted && "bg-success text-white",
                    isCurrent && "bg-cta text-cta-text ring-2 ring-cta/30",
                    !isCompleted && !isCurrent && "bg-white/10 text-text-tertiary"
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </motion.div>

                {/* Step label */}
                {labels && labels[index] && (
                  <span
                    className={cn(
                      "text-sm ml-2",
                      isCurrent ? "text-text-primary font-medium" : "text-text-secondary"
                    )}
                  >
                    {labels[index]}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1",
                    isVertical ? "w-0.5 h-8 ml-3.5 my-1" : "h-0.5 mx-2",
                    isCompleted ? "bg-success" : "bg-white/10"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);
StepProgress.displayName = "StepProgress";

// ─── Exports ───
export {
  Progress,
  CircularProgress,
  StepProgress,
  progressVariants,
};
