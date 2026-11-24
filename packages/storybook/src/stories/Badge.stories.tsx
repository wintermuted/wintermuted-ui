import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "Draft", tone: "neutral" },
  argTypes: {
    children: { control: "text" },
    tone: { control: "select", options: ["neutral", "info", "success", "warning", "danger"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Published: Story = { args: { tone: "success", children: "Published" } };
export const NeedsAttention: Story = { args: { tone: "warning", children: "Needs attention" } };
