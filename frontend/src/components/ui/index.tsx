/* ================================================================
   NEXACORE UI COMPONENTS — Barrel Exports v4.0
   
   Complete component library with research-backed design decisions.
   All components follow WCAG 2.1 AA, support reduced-motion, and
   use the NexaCore design system tokens.
   ================================================================ */

// ─── Motion System ───
export {
  // Framer Motion re-exports
  motion,
  AnimatePresence,
  useReducedMotion,

  // Constants
  DURATION,
  EASE,
  SPRING,

  // Variants — Enter
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInFromLeft,
  slideInFromRight,

  // Variants — Stagger
  staggerContainer,
  staggerContainerFast,
  staggerItem,
  staggerItemScale,

  // Motion Components
  FadeInView,
  ScaleInView,
  StaggerContainer,
  StaggerItem,
  PageTransition,
  SkeletonFade,

  // Hover & Tap effects
  hoverLift,
  hoverScale,
  hoverGlow,
  hoverBrightness,
  tapScale,
  tapScaleSmall,

  // Hooks & Helpers
  getStaggerDelay,
  useMotionSafe,
  useCountUp,
} from "./motion";

// ─── Button ───
export {
  Button,
  MotionButton,
  IconButton,
  buttonVariants,
  type ButtonProps,
  type MotionButtonProps,
  type IconButtonProps,
} from "./button";

// ─── Input ───
export {
  Input,
  SearchInput,
  Textarea,
  Label,
  FormField,
  inputVariants,
  type InputProps,
  type SearchInputProps,
  type TextareaProps,
  type LabelProps,
  type FormFieldProps,
} from "./input";

// ─── Card ───
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
  type CardProps,
  type MotionCardProps,
  type StatCardProps,
} from "./card";

// ─── Badge ───
export {
  Badge,
  AnimatedBadge,
  StatusBadge,
  CountBadge,
  Tag,
  badgeVariants,
  type BadgeProps,
  type AnimatedBadgeProps,
  type StatusBadgeProps,
  type CountBadgeProps,
  type TagProps,
  type StatusType,
} from "./badge";

// ─── Skeleton ───
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
  type SkeletonProps,
  type SkeletonTextProps,
  type SkeletonAvatarProps,
  type SkeletonCardProps,
  type SkeletonTableRowProps,
  type SkeletonButtonProps,
  type SkeletonImageProps,
} from "./skeleton";

// ─── Tooltip ───
export {
  Tooltip,
  ShortcutTooltip,
  InfoTooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
  TooltipPortal,
  type TooltipProps,
  type ShortcutTooltipProps,
  type InfoTooltipProps,
} from "./tooltip";

// ─── Dialog ───
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
  type DialogContentProps,
  type ConfirmDialogProps,
  type AlertDialogProps,
} from "./dialog";

// ─── Avatar ───
export {
  Avatar,
  AvatarGroup,
  AvatarRoot,
  AvatarImage,
  AvatarFallback,
  avatarVariants,
  getInitials,
  getGradientFromName,
  type AvatarProps,
  type AvatarGroupProps,
} from "./avatar";

// ─── Progress ───
export {
  Progress,
  CircularProgress,
  StepProgress,
  progressVariants,
  type ProgressProps,
  type CircularProgressProps,
  type StepProgressProps,
} from "./progress";

// ─── Types ───
export * from "./types";