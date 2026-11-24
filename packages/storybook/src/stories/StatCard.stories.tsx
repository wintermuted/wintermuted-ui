import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatCard } from "@wintermuted/ui-react";

const meta = {
  title: "Components/StatCard",
  component: StatCard,
  args: { label: "Example open tasks", value: 18, tone: "neutral", variant: "default" },
  argTypes: {
    label: { control: "text" }, value: { control: "text" },
    tone: { control: "select", options: ["neutral", "info", "success", "warning", "danger"] },
    variant: { control: "select", options: ["default", "compact"] }, children: { control: false },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Compact: Story = { args: { variant: "compact", tone: "success", label: "Example completed tasks", value: 24 } };
export const ZeroValue: Story = { args: { value: 0 } };
export const WithDetail: Story = { args: { children: <p>Illustrative task totals for a sample project.</p> } };
