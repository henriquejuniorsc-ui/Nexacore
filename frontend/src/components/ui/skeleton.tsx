"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ================================================================
   NEXACORE SKELETON COMPONENT v4.0
   
   Research-backed design decisions:
   ─ Skeleton screens improve perceived performance by 20-30%
   ─ Shimmer animation indicates loading (vs static gray)
   ─ Respects prefers-reduced-motion
   ─ Matches actual content structure for better UX
   ================================================================ */

// ─── Base Skeleton ───
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show shimmer animation */
  animate?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, animate = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white/[0.06] rounded-md",
          animate && "skeleton",
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// ─── Text Skeleton ───
export interface SkeletonTextProps extends SkeletonProps {
  /** Number of lines */
  lines?: number;
  /** Last line width (percentage) */
  lastLineWidth?: number;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, lastLineWidth = 60, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4",
              i === lines - 1 && `w-[${lastLineWidth}%]`
            )}
            style={i === lines - 1 ? { width: `${lastLineWidth}%` } : undefined}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = "SkeletonText";

// ─── Avatar Skeleton ───
export interface SkeletonAvatarProps extends SkeletonProps {
  size?: "sm" | "md" | "lg" | "xl";
}

const avatarSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ size = "md", className, ...props }, ref) => {
    return (
      <Skeleton
        ref={ref}
        className={cn("rounded-full", avatarSizes[size], className)}
        {...props}
      />
    );
  }
);
SkeletonAvatar.displayName = "SkeletonAvatar";

// ─── Card Skeleton ───
export interface SkeletonCardProps extends SkeletonProps {
  /** Show header area */
  header?: boolean;
  /** Show footer area */
  footer?: boolean;
  /** Number of content lines */
  lines?: number;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ header = true, footer = false, lines = 3, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-white/[0.07] bg-surface p-4 space-y-4",
          className
        )}
        {...props}
      >
        {header && (
          <div className="flex items-center gap-3">
            <SkeletonAvatar size="md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        )}

        <SkeletonText lines={lines} />

        {footer && (
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        )}
      </div>
    );
  }
);
SkeletonCard.displayName = "SkeletonCard";

// ─── Stat Card Skeleton ───
const SkeletonStatCard = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-white/[0.07] bg-surface/65 backdrop-blur-lg p-4",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    );
  }
);
SkeletonStatCard.displayName = "SkeletonStatCard";

// ─── Table Row Skeleton ───
export interface SkeletonTableRowProps extends SkeletonProps {
  columns?: number;
}

const SkeletonTableRow = React.forwardRef<HTMLDivElement, SkeletonTableRowProps>(
  ({ columns = 4, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-4 p-4 border-b border-white/[0.05]",
          className
        )}
        {...props}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4",
              i === 0 ? "w-10" : i === 1 ? "w-32 flex-1" : "w-20"
            )}
          />
        ))}
      </div>
    );
  }
);
SkeletonTableRow.displayName = "SkeletonTableRow";

// ─── List Item Skeleton ───
const SkeletonListItem = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-3",
          className
        )}
        {...props}
      >
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    );
  }
);
SkeletonListItem.displayName = "SkeletonListItem";

// ─── Button Skeleton ───
export interface SkeletonButtonProps extends SkeletonProps {
  size?: "sm" | "md" | "lg";
}

const buttonSizes = {
  sm: "h-8 w-20",
  md: "h-10 w-24",
  lg: "h-12 w-32",
};

const SkeletonButton = React.forwardRef<HTMLDivElement, SkeletonButtonProps>(
  ({ size = "md", className, ...props }, ref) => {
    return (
      <Skeleton
        ref={ref}
        className={cn("rounded-lg", buttonSizes[size], className)}
        {...props}
      />
    );
  }
);
SkeletonButton.displayName = "SkeletonButton";

// ─── Image Skeleton ───
export interface SkeletonImageProps extends SkeletonProps {
  aspectRatio?: "square" | "video" | "wide";
}

const aspectRatios = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[2/1]",
};

const SkeletonImage = React.forwardRef<HTMLDivElement, SkeletonImageProps>(
  ({ aspectRatio = "video", className, ...props }, ref) => {
    return (
      <Skeleton
        ref={ref}
        className={cn("w-full rounded-lg", aspectRatios[aspectRatio], className)}
        {...props}
      />
    );
  }
);
SkeletonImage.displayName = "SkeletonImage";

// ─── Chart Skeleton ───
const SkeletonChart = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-white/[0.07] bg-surface p-4",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="h-48 flex items-end justify-between gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    );
  }
);
SkeletonChart.displayName = "SkeletonChart";

// ─── Dashboard Skeleton (full page) ───
const SkeletonDashboard = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-6", className)} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonChart />
          </div>
          <div className="space-y-4">
            <SkeletonCard lines={2} />
            <SkeletonCard header={false} lines={4} />
          </div>
        </div>
      </div>
    );
  }
);
SkeletonDashboard.displayName = "SkeletonDashboard";

// ─── Exports ───
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonTableRow,
  SkeletonListItem,
  SkeletonButton,
  SkeletonImage,
  SkeletonChart,
  SkeletonDashboard,
};
