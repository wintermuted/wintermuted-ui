import type * as React from "react";
import type { ThemePreference, ResolvedTheme } from "./theme.js";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export interface Primitive<Default extends React.ElementType> {
  (props: { as?: Default } & React.ComponentPropsWithRef<Default>): React.ReactElement | null;
  <T extends React.ElementType>(
    props: { as: T } & Omit<React.ComponentPropsWithRef<T>, "as">
  ): React.ReactElement | null;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "warning" | "link";
  size?: "sm";
  icon?: React.ReactNode;
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { tone?: Tone }
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> { tone?: Tone }
export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> { label?: string }
export interface ProgressBarProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  value?: number; max?: number; label?: string;
}
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> { responsive?: boolean }

export interface ControlProps extends React.AriaAttributes { id?: string; inputId?: string }
export interface FieldGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode; htmlFor?: string; hint?: React.ReactNode; error?: React.ReactNode;
  children: React.ReactElement;
}
export interface AccordionProps extends Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, "title"> {
  title: React.ReactNode;
}

export interface TabItem { id: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean }
export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  items: TabItem[]; value?: string; defaultValue?: string;
  onValueChange?: (id: string) => void; label: string;
}

export interface MenuItem {
  id: string; label: React.ReactNode; href?: string; disabled?: boolean;
  onSelect?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}
export interface MenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode; items: MenuItem[];
}
export interface TooltipProps { text: string; children: React.ReactElement; placement?: "above" | "right" }
export interface DialogProps extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "open" | "onClose" | "title"> {
  open: boolean; onClose: () => void; title: React.ReactNode;
}

export interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  resolvedTheme: ResolvedTheme;
}
export interface ThemeProviderProps { children: React.ReactNode; storageKey?: string }
export interface ThemeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "defaultValue" | "onChange"> {
  label?: string;
}

export interface ToggleOption<Value extends string = string> {
  value: Value;
  label: React.ReactNode;
  icon?: React.ReactNode;
  swatchColor?: string;
  title?: string;
  disabled?: boolean;
}

export interface ToggleGroupProps<Value extends string = string> {
  options: readonly ToggleOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  label: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  appearance?: "segmented" | "outline" | "swatches";
  fullWidth?: boolean;
  className?: string;
}

export interface FacetOption<Value extends string = string> {
  value: Value;
  label: string;
  count: number;
  disabled?: boolean;
  hidden?: boolean;
}

export interface FacetFilterProps<Value extends string = string> {
  label: string;
  options: readonly FacetOption<Value>[];
  selected: readonly Value[];
  onChange: (selected: Value[]) => void;
  available: boolean;
  emptyLabel: string;
  reset: { label: string; count: number; selected: boolean; onSelect: () => void };
  moreLabel: string;
  fewerLabel: string;
}

export interface SortableTableHeaderProps<Key extends string = string> {
  column: Key;
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onSort: (column: Key) => void;
  onDirection: (column: Key) => void;
  directionLabel: string;
  directionIcon: React.ReactNode;
}

export interface StatCardProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
  tone?: Tone;
  variant?: "default" | "compact";
  className?: string;
}

export interface RankedBarItem {
  id: string;
  label: React.ReactNode;
  value: number;
  valueLabel: React.ReactNode;
  color?: string;
}

export interface RankedBarListProps {
  items: readonly RankedBarItem[];
  label: string;
  heading?: React.ReactNode;
  empty: React.ReactNode;
  maximum: number;
  minimumWidthPercent?: number;
}

export interface ToastProps {
  open: boolean;
  message: React.ReactNode;
  action?: React.ReactNode;
  tone?: "success" | "danger" | "warning" | "info";
  onDismiss: () => void;
  dismissLabel: string;
}

export interface ColorChoice {
  value: string;
  label: string;
}

export interface ColorGroup {
  id: string;
  label: string;
  choices: readonly ColorChoice[];
}

export interface ColorPickerProps {
  value: string;
  groups: readonly ColorGroup[];
  onSelect: (value: string, group: string, index: number) => void;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  label: string;
  inputLabel: string;
  hexLabel: string;
  invalidLabel: string;
  inputId?: string;
  draftValue?: string;
  onDraftChange?: (value: string) => void;
  disabled?: boolean;
  placement?: "above" | "right";
  className?: string;
  triggerClassName?: string;
}

export interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  valueLabel: string;
  decreaseIcon: React.ReactNode;
  increaseIcon: React.ReactNode;
  tooltipPlacement?: "above" | "right";
}

export interface LanguageOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface LanguageSelectorProps {
  options: readonly LanguageOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  variant?: "native" | "dropup";
  className?: string;
}
