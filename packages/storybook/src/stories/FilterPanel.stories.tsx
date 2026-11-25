import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldGroup, FilterPanel, Input, Select } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Forms/FilterPanel",
  id: "components-filterpanel",
  component: FilterPanel,
  args: {
    labels: { toggle: "Refine", panel: "Document filters", title: "Refine documents",
      dismiss: "Dismiss refinement", close: "Close refinement" },
    search: <Input aria-label="Find documents" placeholder="Find documents" />,
    summary: "Showing all documents",
    children: <>
      <FieldGroup label="Owner"><Input defaultValue="Ada" /></FieldGroup>
      <FieldGroup label="Document type"><Select defaultValue="all">
        <option value="all">All types</option><option value="notes">Notes</option>
      </Select></FieldGroup>
    </>,
  },
  argTypes: { search: { control: false }, children: { control: false }, classNames: { control: false } },
  parameters: { docs: { description: { component: "Responsive, non-modal disclosure: inline above 48rem and expandable below. Inputs stay mounted; Escape, close and scrim restore toggle focus. No focus trap or scroll lock. Narrow the viewport to exercise dismissal." } } },
} satisfies Meta<typeof FilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
