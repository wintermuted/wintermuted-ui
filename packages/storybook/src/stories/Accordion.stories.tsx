import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  args: { title: "Keyboard instructions", children: "Focus the summary and press Enter or Space to toggle this disclosure." },
  argTypes: {
    title: { control: "text" },
    children: { control: "text" },
    open: { control: false, description: "Use the summary to toggle the native disclosure. The Expanded story starts open." },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Expanded: Story = { args: { open: true } };
