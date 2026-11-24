import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Alert",
  component: Alert,
  args: { children: "Your changes have been saved.", tone: "info" },
  argTypes: {
    children: { control: "text" },
    tone: { control: "select", options: ["neutral", "info", "success", "warning", "danger"] },
    role: { control: "select", options: ["status", "alert"] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Success: Story = { args: { tone: "success" } };
export const Warning: Story = { args: { tone: "warning", children: "This project has unsaved changes." } };
export const Error: Story = { args: { tone: "danger", role: "alert", children: "The project could not be saved. Check your connection and try again." } };
