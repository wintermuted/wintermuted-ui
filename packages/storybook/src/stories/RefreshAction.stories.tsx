import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { RefreshAction } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Actions/RefreshAction",
  id: "components-refreshaction",
  component: RefreshAction,
  args: {
    loading: false, error: false, disabled: false, onRefresh: fn(), variant: "secondary",
    labels: { idle: "Update records", loading: "Updating records", retry: "Retry records" },
  },
  argTypes: {
    loading: { control: "boolean" }, error: { control: "boolean" }, disabled: { control: "boolean" },
    labels: { control: "object" }, icon: { control: false },
    variant: { control: "select", options: ["primary", "secondary", "ghost", "danger", "success", "warning", "link"] },
    size: { control: "select", options: [undefined, "sm"] },
  },
  parameters: { docs: { description: { component: "Button composition with supplied loading/retry/idle content. Loading takes precedence and disables interaction. The callback owns requests and snapshot policy." } } },
} satisfies Meta<typeof RefreshAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Retry: Story = { args: { error: true } };
export const Loading: Story = { args: { loading: true, error: true } };
export const Disabled: Story = { args: { disabled: true } };
