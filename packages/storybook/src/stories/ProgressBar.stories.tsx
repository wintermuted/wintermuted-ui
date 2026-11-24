import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Feedback/ProgressBar",
  id: "components-progressbar",
  component: ProgressBar,
  args: { label: "Documentation progress", value: 60, max: 100 },
  argTypes: {
    label: { control: "text" },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    max: { control: { type: "number", min: 1 } },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Empty: Story = { args: { value: 0 } };
export const Complete: Story = { args: { value: 100 } };
