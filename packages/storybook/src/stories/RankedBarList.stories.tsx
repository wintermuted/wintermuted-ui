import type { Meta, StoryObj } from "@storybook/react-vite";
import { RankedBarList } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Data display/RankedBarList",
  id: "components-rankedbarlist",
  component: RankedBarList,
  args: {
    label: "Example tasks by team", heading: "Example task distribution", maximum: 20,
    empty: "No teams match your filters.", minimumWidthPercent: 0,
    items: [
      { id: "engineering", label: "Engineering", value: 18, valueLabel: "18 tasks", color: "var(--wm-color-accent)" },
      { id: "design", label: "Design", value: 12, valueLabel: "12 tasks", color: "var(--wm-color-success)" },
      { id: "documentation", label: "Documentation", value: 3, valueLabel: "3 tasks", color: "var(--wm-color-warning)" },
    ],
  },
  argTypes: {
    heading: { control: "text" }, empty: { control: "text" }, items: { control: false },
    maximum: { control: { type: "number", min: 0 } },
    minimumWidthPercent: { control: { type: "range", min: 0, max: 100 } },
  },
  decorators: [(Story) => <div className="wm-storybook-field"><Story /></div>],
} satisfies Meta<typeof RankedBarList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Empty: Story = { args: { items: [] } };
export const ZeroMaximum: Story = { args: { maximum: 0 } };
