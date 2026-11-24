import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { FacetFilter, type FacetFilterProps } from "@wintermuted/ui-react";

type FacetArgs = FacetFilterProps<string>;

const meta = {
  title: "Components/FacetFilter",
  render: function FacetExample(args) {
    const [, updateArgs] = useArgs<FacetArgs>();
    return <div className="wm-storybook-field"><FacetFilter {...args}
      onChange={selected => { updateArgs({ selected }); args.onChange(selected); }}
      reset={{ ...args.reset, selected: args.selected.length === 0, onSelect: () => {
        updateArgs({ selected: [] }); args.reset.onSelect();
      } }} /></div>;
  },
  args: {
    label: "Teams", selected: ["engineering"], available: true, onChange: fn(),
    options: [
      { value: "design", label: "Design", count: 8 },
      { value: "engineering", label: "Engineering", count: 12 },
      { value: "archived", label: "Archived", count: 0, disabled: true },
      { value: "documentation", label: "Documentation", count: 4, hidden: true },
    ],
    emptyLabel: "No teams are available.", moreLabel: "Show more teams", fewerLabel: "Show fewer teams",
    reset: { label: "All teams", count: 24, selected: false, onSelect: fn() },
  },
  argTypes: {
    selected: { control: "object" }, available: { control: "boolean" }, options: { control: false }, reset: { control: false },
  },
  parameters: { docs: { description: { component: "Controlled facet selection with counts, disabled and initially hidden options. The reset checkbox clears the selection; expansion does not discard selected values." } } },
} satisfies Meta<FacetArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Unavailable: Story = { args: { available: false } };
export const AllTeams: Story = { args: { selected: [] } };
