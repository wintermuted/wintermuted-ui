import type { ReactElement } from "react";
import type { GroupBase, Props } from "react-select";

export type MultiSelectProps<Option = unknown, IsMulti extends boolean = true,
  Group extends GroupBase<Option> = GroupBase<Option>> = Props<Option, IsMulti, Group>;

export function MultiSelect<Option = unknown, IsMulti extends boolean = true,
  Group extends GroupBase<Option> = GroupBase<Option>>(
  props: MultiSelectProps<Option, IsMulti, Group>
): ReactElement;
