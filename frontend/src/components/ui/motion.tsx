"use client";

import { motion, HTMLMotionProps, Variants, AnimatePresence, useReducedMotion } from "framer-motion";
import { ReactNode, forwardRef, useEffect, useState } from "react";

/* ================================================================
   NEXACORE MOTION SYSTEM v4.0
   
   Research-backed animation parameters:
   ─ 100-300ms optimal perception range (cognitive psychology)
   ─ Ease-out (decelerate) for entering elements
   ─ Ease-in (accelerate) for exiting elements
   ─ Material Design 3 easing curves
   ─ prefers-reduced-motion: respect always
   ================================================================ */

// ─── Duration constants (seconds) ───
export const DURATION = {
  instant: 0.05,
  micro: 0.1,
  fast: 0.15,
  normal: 0.2,
  moderate: 0.25,
  slow: 0.3,
  page: 0.35,
  complex: 0.4,
} as const;

// ─── Easing curves (Material Design 3) ───
export const EASE = {
  // For most transitions
  standard: [0.2, 0, 0, 1],
  // For entering elements (ease-out / decelerate)
  decelerate: [0, 0, 0, 1],
  // For exiting elements (ease-in / accelerate)
  accelerate: [0.3, 0, 1, 1],
  // For emphasized transitions
  emphasized: [0.05, 0.7, 0.1, 1],
  // Playful bounce
  spring: [0.34, 1.56, 0.64, 1],
  // Natural smooth
  smooth: [0.22, 1, 0.36, 1],
  // Snappy interactions
  snappy: [0.16, 1, 0.3, 1],
  // Gentle for backgrounds
  gentle: [0.4, 0, 0.2, 1],
} as const;

// ─── Spring configs ───
export const SPRING = {
  // Gentle — for page elements
  gentle: { type: "spring" as const, stiffness: 120, damping: 14, mass: 1 },
  // Snappy — for buttons and small elements
  snappy: { type: "spring" as const, stiffness: 300, damping: 20, mass: 0.8 },
  // Bouncy — for playful interactions
  bouncy: { type: "spring" as const, stiffness: 400, damping: 10, mass: 0.5 },
  // Smooth — for modals and large surfaces
  smooth: { type: "spring" as const, stiffness: 200, damping: 24, mass: 1 },
} as const;


/* ================================================================
   ENTER VARIANTS — Ease-out (decelerate) for natural arrival
   ================================================================ */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: DURATION.normal, ease: EASE.decelerate } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: DURATION.fast, ease: EASE.accelerate } 
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { duration: DURATION.slow, ease: EASE.emphasized } 
  },
  exit: { 
    opacity: 0, y: 8, 
    transition: { duration: DURATION.fast, ease: EASE.accelerate } 
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { duration: DURATION.slow, ease: EASE.emphasized } 
  },
  exit: { 
    opacity: 0, y: -8, 
    transition: { duration: DURATION.fast, ease: EASE.accelerate } 
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, scale: 1, 
    transition: { duration: DURATION.normal, ease: EASE.spring } 
  },
  exit: { 
    opacity: 0, scale: 0.95, 
    transition: { duration: DURATION.fast, ease: EASE.accelerate } 
  },
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, x: 0, 
    transition: { duration: DURATION.slow, ease: EASE.emphasized } 
  },
  exit: { 
    opacity: 0, x: -12, 
    transition: { duration: DURATION.fast, ease: EASE.accelerate } 
  },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, x: 0, 
    transition: { duration: DURATION.slow, ease: EASE.emphasized } 
  },
  exit: { 
    opacity: 0, x: 12, 
    transition: { duration: DURATION.fast, ease: EASE.accelerate } 
  },
};


/* ================================================================
   CONTAINER VARIANTS — Stagger children
   Research: 50-80ms stagger feels natural and rhythmic
   ================================================================ */

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.06, 
      delayChildren: 0.08,
    } 
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.04, 
      delayChildren: 0.05,
    } 
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { duration: DURATION.normal, ease: EASE.emphasized } 
  },
  exit: { 
    opacity: 0, y: 8, 
    transition: { duration: DURATION.fast, ease: EASE.accelerate } 
  },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, scale: 1, 
    transition: { duration: DURATION.normal, ease: EASE.spring } 
  },
};


/* ================================================================
   MOTION COMPONENTS — Reusable wrappers
   ================================================================ */

interface MotionDivProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

/**
 * FadeInView — Fades in + slides up when visible in viewport
 * Uses IntersectionObserver via framer-motion
 */
export const FadeInView = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, ...props }, ref) => {
    const prefersReduced = useReducedMotion();
    return (
      <motion.div
        ref={ref}
        initial={prefersReduced ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeInUp}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeInView.displayName = "FadeInView";

/**
 * ScaleInView — Scales in when visible
 */
export const ScaleInView = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, ...props }, ref) => {
    const prefersReduced = useReducedMotion();
    return (
      <motion.div
        ref={ref}
        initial={prefersReduced ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={scaleIn}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ScaleInView.displayName = "ScaleInView";

/**
 * StaggerContainer — Staggers children animation
 */
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  fast?: boolean;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, className, fast = false, ...props }, ref) => {
    const prefersReduced = useReducedMotion();
    return (
      <motion.div
        ref={ref}
        initial={prefersReduced ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fast ? staggerContainerFast : staggerContainer}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

/**
 * StaggerItem — Child of StaggerContainer
 */
export const StaggerItem = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div ref={ref} variants={staggerItem} {...props}>
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = "StaggerItem";

/**
 * PageTransition — Wraps page content with enter/exit animations
 */
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReduced = useReducedMotion();
  
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: DURATION.page, ease: EASE.emphasized }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * SkeletonFade — Shows skeleton then fades to content when loaded
 */
interface SkeletonFadeProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SkeletonFade({ isLoading, skeleton, children, className }: SkeletonFadeProps) {
  const prefersReduced = useReducedMotion();
  
  if (prefersReduced) {
    return <div className={className}>{isLoading ? skeleton : children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast }}
          className={className}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.normal, ease: EASE.decelerate }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


/* ================================================================
   HOVER & TAP EFFECTS — For motion.div whileHover/whileTap
   ================================================================ */

export const hoverLift = {
  rest: { y: 0, transition: { duration: DURATION.fast, ease: EASE.gentle } },
  hover: { y: -3, transition: { duration: DURATION.fast, ease: EASE.gentle } },
};

export const hoverScale = {
  rest: { scale: 1, transition: { duration: DURATION.fast, ease: EASE.gentle } },
  hover: { scale: 1.02, transition: { duration: DURATION.fast, ease: EASE.gentle } },
};

export const hoverGlow = {
  rest: { boxShadow: "0 0 0 rgba(255, 0, 110, 0)", transition: { duration: DURATION.normal } },
  hover: { boxShadow: "0 0 20px rgba(255, 0, 110, 0.3)", transition: { duration: DURATION.normal } },
};

export const hoverBrightness = {
  rest: { filter: "brightness(1)", transition: { duration: DURATION.fast } },
  hover: { filter: "brightness(1.1)", transition: { duration: DURATION.fast } },
};

export const tapScale = { scale: 0.97, transition: { duration: 0.1, ease: EASE.snappy } };

export const tapScaleSmall = { scale: 0.98, transition: { duration: 0.08 } };


/* ================================================================
   HELPERS
   ================================================================ */

/**
 * Calculate stagger delay for indexed items
 * Research: 50-80ms between items feels natural
 */
export function getStaggerDelay(index: number, baseDelay = 0.05): number {
  return index * baseDelay;
}

/**
 * Hook to detect reduced motion preference
 */
export function useMotionSafe() {
  const prefersReduced = useReducedMotion();
  return !prefersReduced;
}

/**
 * Hook for counting animation (e.g., stats counters)
 * Animates from 0 to target value
 */
export function useCountUp(target: number, duration: number = 600, enabled: boolean = true) {
  const [count, setCount] = useState(0);
  const prefersReduced = useReducedMotion();
  
  useEffect(() => {
    if (!enabled || prefersReduced) {
      setCount(target);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out decelerate curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [target, duration, enabled, prefersReduced]);

  return count;
}

// Re-export framer-motion essentials
export { motion, AnimatePresence, useReducedMotion };