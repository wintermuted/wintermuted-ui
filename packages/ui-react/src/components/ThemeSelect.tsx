import { useId } from "react";
import { isThemePreference } from "../theme.js";
import type { ThemeSelectProps } from "../interfaces.js";
import { useTheme } from "../useTheme.js";
import { FieldGroup } from "./FieldGroup.js";
import { Select } from "./Select.js";

export function ThemeSelect({ label = "Appearance", id, ...props }: ThemeSelectProps) {
  const generated = useId();
  const { preference, setPreference } = useTheme();
  const controlId = id || generated;
  return <FieldGroup label={label} htmlFor={controlId}>
    <Select {...props} id={controlId} value={preference} onChange={event => {
      const next = event.target.value;
      if (!isThemePreference(next)) throw new TypeError("Theme preference must be system, light, or dark.");
      setPreference(next);
    }}>
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </Select>
  </FieldGroup>;
}
