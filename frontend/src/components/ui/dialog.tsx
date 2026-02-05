"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./button";

/* ================================================================
   NEXACORE DIALOG COMPONENT v4.0
   
   Research-backed design decisions:
   ─ Focus trap for accessibility
   ─ ESC to close for quick dismissal
   ─ Backdrop click to close (optional)
   ─ Smooth animations (200ms scale + fade)
   ─ Mobile-responsive (full-screen on small devices)
   ================================================================ */

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

// ─── Overlay ───
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ─── Content ───
export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Show close button */
  showClose?: boolean;
  /** Size of the dialog */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Prevent closing on overlay click */
  preventOverlayClose?: boolean;
}

const dialogSizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[90vw] h-[90vh]",
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      showClose = true,
      size = "md",
      preventOverlayClose = false,
      ...props
    },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        onPointerDownOutside={(e) => {
          if (preventOverlayClose) {
            e.preventDefault();
          }
        }}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]",
          "bg-surface border border-white/10 rounded-xl shadow-2xl",
          "p-6",
          "duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          dialogSizes[size],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1.5 text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ─── Header ───
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

// ─── Footer ───
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

// ─── Title ───
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-text-primary",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// ─── Description ───
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-secondary mt-2", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// ─── Confirm Dialog ───
export interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const variantConfig = {
  default: {
    icon: Info,
    iconClass: "text-trust bg-trust/10",
    buttonVariant: "primary" as ButtonProps["variant"],
  },
  danger: {
    icon: AlertTriangle,
    iconClass: "text-error bg-error/10",
    buttonVariant: "destructive" as ButtonProps["variant"],
  },
  warning: {
    icon: AlertCircle,
    iconClass: "text-warning bg-warning/10",
    buttonVariant: "primary" as ButtonProps["variant"],
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
  isLoading = false,
  children,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent size="sm" showClose={false} preventOverlayClose={isLoading}>
        <div className="flex items-start gap-4">
          <div className={cn("p-2 rounded-lg shrink-0", config.iconClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 pt-0.5">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </div>
        </div>
        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
ConfirmDialog.displayName = "ConfirmDialog";

// ─── Alert Dialog (non-dismissible) ───
export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: "success" | "error" | "warning" | "info";
  onConfirm?: () => void;
}

const alertVariantConfig = {
  success: {
    icon: CheckCircle,
    iconClass: "text-success bg-success/10",
  },
  error: {
    icon: AlertTriangle,
    iconClass: "text-error bg-error/10",
  },
  warning: {
    icon: AlertCircle,
    iconClass: "text-warning bg-warning/10",
  },
  info: {
    icon: Info,
    iconClass: "text-info bg-info/10",
  },
};

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "OK",
  variant = "info",
  onConfirm,
}) => {
  const config = alertVariantConfig[variant];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" showClose={false}>
        <div className="flex flex-col items-center text-center">
          <div className={cn("p-3 rounded-full mb-4", config.iconClass)}>
            <Icon className="h-6 w-6" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="mt-2">{description}</DialogDescription>
          )}
        </div>
        <DialogFooter className="mt-6 sm:justify-center">
          <DialogClose asChild>
            <Button onClick={onConfirm}>{confirmText}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
AlertDialog.displayName = "AlertDialog";

// ─── Exports ───
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  ConfirmDialog,
  AlertDialog,
};
