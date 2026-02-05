"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ================================================================
   NEXACORE AVATAR COMPONENT v4.0
   
   Research-backed design decisions:
   ─ Gradient fallback for better UX when no image
   ─ Initials extraction for personalization
   ─ Status indicator for presence
   ─ Multiple sizes for different contexts
   ================================================================ */

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// ─── Avatar Root ───
const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> &
    VariantProps<typeof avatarVariants>
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
));
AvatarRoot.displayName = AvatarPrimitive.Root.displayName;

// ─── Avatar Image ───
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// ─── Avatar Fallback ───
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      "bg-gradient-to-br from-brand-pink to-brand-orange",
      "text-white font-semibold",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// ─── Helper: Get initials from name ───
function getInitials(name: string): string {
  if (!name) return "?";
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Helper: Generate consistent gradient from name ───
function getGradientFromName(name: string): string {
  const gradients = [
    "from-brand-pink to-brand-orange",
    "from-trust to-info",
    "from-success to-trust",
    "from-warning to-brand-orange",
    "from-brand-pink to-trust",
    "from-info to-success",
    "from-error to-brand-pink",
    "from-warning to-success",
  ];

  // Simple hash based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// ─── Complete Avatar Component ───
export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Image source URL */
  src?: string | null;
  /** Alt text for image */
  alt?: string;
  /** Name for initials fallback */
  name?: string;
  /** Custom fallback content */
  fallback?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Show online/offline indicator */
  status?: "online" | "offline" | "away" | "busy";
  /** Click handler */
  onClick?: () => void;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      fallback,
      size,
      status,
      className,
      onClick,
    },
    ref
  ) => {
    const initials = name ? getInitials(name) : fallback || "?";
    const gradient = name ? getGradientFromName(name) : "from-brand-pink to-brand-orange";

    return (
      <div className="relative inline-flex">
        <AvatarRoot
          ref={ref}
          size={size}
          className={cn(onClick && "cursor-pointer", className)}
          onClick={onClick}
        >
          {src && (
            <AvatarImage src={src} alt={alt || name || "Avatar"} />
          )}
          <AvatarFallback className={cn("bg-gradient-to-br", gradient)}>
            {initials}
          </AvatarFallback>
        </AvatarRoot>

        {/* Status indicator */}
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
              size === "xs" && "h-1.5 w-1.5",
              size === "sm" && "h-2 w-2",
              size === "md" && "h-2.5 w-2.5",
              size === "lg" && "h-3 w-3",
              size === "xl" && "h-3.5 w-3.5",
              size === "2xl" && "h-4 w-4",
              !size && "h-2.5 w-2.5",
              status === "online" && "bg-success",
              status === "offline" && "bg-text-tertiary",
              status === "away" && "bg-warning",
              status === "busy" && "bg-error"
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

// ─── Avatar Group ───
export interface AvatarGroupProps {
  /** Maximum avatars to show */
  max?: number;
  /** Size of avatars */
  size?: AvatarProps["size"];
  /** Avatars to display */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max = 4, size = "md", children, className }, ref) => {
    const childArray = React.Children.toArray(children);
    const visibleChildren = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    return (
      <div ref={ref} className={cn("flex -space-x-2", className)}>
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className="ring-2 ring-background rounded-full"
            style={{ zIndex: visibleChildren.length - index }}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<AvatarProps>, { size })
              : child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              "bg-surface-hover border-2 border-background",
              "text-text-secondary font-medium",
              avatarVariants({ size })
            )}
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

// ─── Exports ───
export {
  Avatar,
  AvatarGroup,
  AvatarRoot,
  AvatarImage,
  AvatarFallback,
  avatarVariants,
  getInitials,
  getGradientFromName,
};
