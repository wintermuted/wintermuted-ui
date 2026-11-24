import { useLayoutEffect, type ReactNode } from "react";
import type { Preview } from "@storybook/react-vite";
import { applyTheme, type ResolvedTheme } from "@wintermuted/ui-react/theme";
import "@wintermuted/ui-theme/index.css";
import "./preview.css";

function ThemePreview({ theme, storyId, children }: { theme: ResolvedTheme; storyId: string; children: ReactNode }) {
  useLayoutEffect(() => { applyTheme(theme); }, [theme, storyId]);
  return <div className="wm-storybook-preview">{children}</div>;
}

const preview: Preview = {
  tags: ["autodocs"],
  initialGlobals: { theme: "light" },
  globalTypes: {
    theme: {
      description: "Wintermuted preview theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, context) => (
      <ThemePreview theme={context.globals.theme === "dark" ? "dark" : "light"} storyId={context.id}>
        <Story />
      </ThemePreview>
    ),
  ],
};

export default preview;
