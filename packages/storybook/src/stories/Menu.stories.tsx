import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Menu } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Overlays/Menu",
  id: "components-menu",
  component: Menu,
  args: {
    label: "Project actions",
    items: [
      { id: "edit", label: "Edit project", onSelect: fn() },
      { id: "duplicate", label: "Duplicate project", onSelect: fn() },
      { id: "archive", label: "Archive project", disabled: true },
    ],
  },
  argTypes: { label: { control: "text" }, items: { control: false } },
  decorators: [(Story) => <div className="wm-storybook-menu-stage"><Story /></div>],
  parameters: { docs: { description: { component: "Open with Enter or ArrowDown/ArrowUp. Navigate with arrow keys, Home, and End; Escape dismisses and restores trigger focus. Selections appear in Actions." } } },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const AllUnavailable: Story = {
  args: { items: [{ id: "archive", label: "Archive project", disabled: true }] },
};
