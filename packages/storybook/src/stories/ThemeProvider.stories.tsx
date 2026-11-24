import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider, ThemeSelect, useTheme } from "@wintermuted/ui-react";
import { withThemeProvider } from "../decorators/withThemeProvider.js";

function ThemeStatus() {
  const { preference, resolvedTheme } = useTheme();
  return <div className="wm-storybook-stack">
    <ThemeSelect label="Provider appearance" />
    <p role="status">Preference: {preference}. Resolved theme: {resolvedTheme}.</p>
  </div>;
}

const meta = {
  title: "Components/Theming/ThemeProvider",
  id: "components-themeprovider",
  component: ThemeProvider,
  decorators: [withThemeProvider],
  render: () => <div className="wm-storybook-field"><ThemeStatus /></div>,
  argTypes: { children: { control: false }, storageKey: { control: false } },
  parameters: {
    docs: {
      description: { component: "The story decorator mounts the real ThemeProvider. ThemeSelect changes its preference, while useTheme exposes preference and resolvedTheme below. Toolbar changes synchronize with the provider. Storage uses a story-specific wintermuted:storybook: key, never the default consumer preference key." },
      story: { inline: false, height: "300px" },
    },
  },
} satisfies Meta<typeof ThemeProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: { children: null } };
