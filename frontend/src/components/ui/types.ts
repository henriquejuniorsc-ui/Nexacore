/* ================================================================
   NEXACORE UI TYPES v4.0
   
   Shared TypeScript types for the component library
   ================================================================ */

// ─── Common Props ───
export interface CommonProps {
  /** Additional CSS class names */
  className?: string;
  /** Children elements */
  children?: React.ReactNode;
}

// ─── Size Variants ───
export type Size = "xs" | "sm" | "md" | "lg" | "xl";

// ─── Color Variants ───
export type ColorVariant = 
  | "default" 
  | "primary" 
  | "secondary" 
  | "success" 
  | "warning" 
  | "error" 
  | "info";

// ─── Semantic Status ───
export type Status = 
  | "active" 
  | "inactive" 
  | "pending" 
  | "completed" 
  | "cancelled" 
  | "draft";

// ─── Temperature (for leads/contacts) ───
export type Temperature = "hot" | "warm" | "cold";

// ─── Presence Status ───
export type PresenceStatus = "online" | "offline" | "away" | "busy";

// ─── Position/Placement ───
export type Placement = "top" | "right" | "bottom" | "left";

export type Alignment = "start" | "center" | "end";

// ─── Animation Props ───
export interface AnimationProps {
  /** Enable/disable animations */
  animated?: boolean;
  /** Animation duration in ms */
  duration?: number;
  /** Animation delay in ms */
  delay?: number;
}

// ─── Loading State ───
export interface LoadingProps {
  /** Show loading state */
  isLoading?: boolean;
  /** Loading text */
  loadingText?: string;
}

// ─── Async Action Props ───
export interface AsyncActionProps extends LoadingProps {
  /** Disable the element */
  disabled?: boolean;
}

// ─── Form Field Props ───
export interface FieldProps {
  /** Field label */
  label?: string;
  /** Field name */
  name?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

// ─── Icon Props ───
export interface IconProps {
  /** Icon size */
  size?: number | string;
  /** Icon color */
  color?: string;
  /** Stroke width */
  strokeWidth?: number;
}

// ─── Change Handler Types ───
export type ChangeHandler<T> = (value: T) => void;
export type AsyncChangeHandler<T> = (value: T) => void | Promise<void>;

// ─── Utility Types ───

/** Make specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Extract props from a component */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

// ─── Theme Types ───
export type Theme = "light" | "dark" | "system";

// ─── Responsive Value ───
export type ResponsiveValue<T> = T | {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
};

// ─── Data Display Types ───
export interface DataItem {
  id: string;
  [key: string]: unknown;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortingState {
  field: string;
  direction: "asc" | "desc";
}

// ─── Form Types ───
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

export interface RadioOption extends SelectOption {
  id?: string;
}

// ─── Date/Time Types ───
export interface DateRange {
  from: Date;
  to: Date;
}

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

// ─── Navigation Types ───
export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ─── Table Types ───
export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => unknown);
  cell?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

// ─── Chart Types ───
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartConfig {
  xAxis?: {
    dataKey: string;
    label?: string;
  };
  yAxis?: {
    label?: string;
    domain?: [number, number];
  };
  tooltip?: boolean;
  legend?: boolean;
  grid?: boolean;
}
