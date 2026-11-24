import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Tooltip } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  args: { text: "Save the current project", placement: "above", children: <Button variant="secondary">Save project</Button> },
  argTypes: { text: { control: "text" }, placement: { control: "select", options: ["above", "right"] }, children: { control: false } },
  decorators: [(Story) => <div className="wm-storybook-tooltip-stage"><Story /></div>],
  parameters: { docs: { description: { component: "Hover or focus the button to reveal the description. Escape dismisses it without moving focus." } } },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Right: Story = { args: { placement: "right" } };
