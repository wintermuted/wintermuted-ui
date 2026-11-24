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
export interface TooltipProps { text: string; children: React.ReactElement }
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
