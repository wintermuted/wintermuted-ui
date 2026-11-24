import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Button } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Actions/Button",
  id: "components-button",
  component: Button,
  args: { children: "Save changes", variant: "primary", disabled: false, onClick: fn() },
  argTypes: {
    children: { control: "text" },
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "success", "warning", "link"],
    },
    size: { control: "select", options: [undefined, "sm"] },
    disabled: { control: "boolean" },
    icon: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true } };
