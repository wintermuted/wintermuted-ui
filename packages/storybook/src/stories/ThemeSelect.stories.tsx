import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeSelect } from "@wintermuted/ui-react";
import { withThemeProvider } from "../decorators/withThemeProvider.js";

const meta = {
  title: "Components/ThemeSelect",
  component: ThemeSelect,
  decorators: [
    withThemeProvider,
    (Story) => <div className="wm-storybook-field"><Story /></div>,
  ],
  args: { label: "Appearance", disabled: false },
  argTypes: { label: { control: "text" }, disabled: { control: "boolean" } },
  parameters: {
    docs: {
      description: { component: "A labeled System/Light/Dark selector inside the real ThemeProvider. Selection updates the preview and mirrors its resolved light/dark mode in the toolbar; only a story-specific storage key is used." },
      story: { inline: false, height: "240px" },
    },
  },
} satisfies Meta<typeof ThemeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Disabled: Story = { args: { disabled: true } };
