import type * as React from "react";
import type { ThemePreference, ResolvedTheme } from "./theme";
export type { ThemePreference, ResolvedTheme } from "./theme";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";
type Primitive<Default extends React.ElementType> = {
  (props: { as?: Default } & React.ComponentPropsWithRef<Default>): React.ReactElement | null;
  <T extends React.ElementType>(
    props: { as: T } & Omit<React.ComponentPropsWithRef<T>, "as">
  ): React.ReactElement | null;
};
export const Card: Primitive<"section">;
export const CardHeader: Primitive<"header">;
export const CardBody: Primitive<"div">;
export const CardTitle: Primitive<"h3">;
export const CardText: Primitive<"p">;
export const CardFooter: Primitive<"footer">;
export const ListGroup: Primitive<"ul">;
export const ListItem: Primitive<"li">;
export const Nav: Primitive<"nav">;
export const Input: Primitive<"input">;
export const Select: Primitive<"select">;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "warning" | "link";
  size?: "sm";
  icon?: React.ReactNode;
}
export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { tone?: Tone }
export const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLSpanElement>>;
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> { tone?: Tone }
export const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;
export function Spinner(props: React.HTMLAttributes<HTMLSpanElement> & { label?: string }): React.ReactElement;
export function ProgressBar(props: React.ProgressHTMLAttributes<HTMLProgressElement> & {
  value?: number; max?: number; label?: string;
}): React.ReactElement;
export const Table: React.ForwardRefExoticComponent<React.TableHTMLAttributes<HTMLTableElement> & {
  responsive?: boolean;
} & React.RefAttributes<HTMLTableElement>>;
export interface FieldGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode; htmlFor?: string; hint?: React.ReactNode; error?: React.ReactNode;
  children: React.ReactElement;
}
export function FieldGroup(props: FieldGroupProps): React.ReactElement;
export function Accordion(props: Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, "title"> & {
  title: React.ReactNode;
}): React.ReactElement;
export interface TabItem { id: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean }
export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  items: TabItem[]; value?: string; defaultValue?: string;
  onValueChange?: (id: string) => void; label: string;
}
export function Tabs(props: TabsProps): React.ReactElement;
export interface MenuItem {
  id: string; label: React.ReactNode; href?: string; disabled?: boolean;
  onSelect?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}
export function Menu(props: Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  label: React.ReactNode; items: MenuItem[];
}): React.ReactElement;
export function Tooltip(props: { text: string; children: React.ReactElement }): React.ReactElement;
export function Dialog(props: Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "open" | "onClose" | "title"> & {
  open: boolean; onClose: () => void; title: React.ReactNode;
}): React.ReactElement;
export interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  resolvedTheme: ResolvedTheme;
}
export function ThemeProvider(props: { children: React.ReactNode; storageKey?: string }): React.ReactElement;
export function useTheme(): ThemeContextValue;
export function ThemeSelect(props: Omit<React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "defaultValue" | "onChange"> & { label?: string }): React.ReactElement;
