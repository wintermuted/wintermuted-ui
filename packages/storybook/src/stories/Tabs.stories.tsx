import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Tabs, type TabsProps } from "@wintermuted/ui-react";

function TabsExample(args: TabsProps) {
  const [, updateArgs] = useArgs<TabsProps>();
  return <Tabs {...args} onValueChange={value => {
    updateArgs({ value });
    args.onValueChange?.(value);
  }} />;
}

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  render: TabsExample,
  args: {
    label: "Project details",
    value: "overview",
    onValueChange: fn(),
    items: [
      { id: "overview", label: "Overview", content: <p>Project summary and recent activity.</p> },
      { id: "settings", label: "Settings", content: <p>Project settings and preferences.</p> },
      { id: "billing", label: "Billing", content: <p>Billing details.</p>, disabled: true },
    ],
  },
  argTypes: {
    label: { control: "text" },
    value: { control: "select", options: ["overview", "settings"] },
    items: { control: false },
  },
  parameters: {
    docs: { description: { component: "Controlled tabs with a disabled item. Use Left/Right, Home, and End to navigate; selection stays synchronized with Controls." } },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const SettingsSelected: Story = { args: { value: "settings" } };
