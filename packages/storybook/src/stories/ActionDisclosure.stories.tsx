import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ActionDisclosure, FieldGroup, Input } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Layout/ActionDisclosure",
  id: "components-actiondisclosure",
  component: ActionDisclosure,
  args: {
    title: "Record options", headingLevel: 3, defaultExpanded: true, onCollapse: fn(),
    children: <FieldGroup label="Record name"><Input defaultValue="Quarterly report" /></FieldGroup>,
  },
  argTypes: {
    title: { control: "text" }, headingLevel: { control: "select", options: [2, 3, 4, 5, 6] },
    defaultExpanded: { control: false, description: "Initial state only; use the heading button to toggle." },
    children: { control: false }, action: { control: false }, indicator: { control: false },
    headingId: { control: false }, classNames: { control: false },
  },
  parameters: { docs: { description: { component: "A heading button and optional sibling action, not an interactive summary. Hidden children retain state. Collapse callbacks run before hiding; action callbacks follow scheduling expansion. The host owns post-render focus and cleanup." } } },
} satisfies Meta<typeof ActionDisclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const InitiallyCollapsed: Story = { args: { defaultExpanded: false } };
export const WithAction: Story = { args: { action: { label: "Edit records", onClick: fn() } } };
export const WithIconAction: Story = {
  args: { defaultExpanded: false, action: { label: "Edit records", icon: "+", onClick: fn() } },
};
