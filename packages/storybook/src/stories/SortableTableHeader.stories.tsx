import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { SortableTableHeader, Table, type SortableTableHeaderProps } from "@wintermuted/ui-react";

type SortArgs = SortableTableHeaderProps<"name">;
const projects = [{ name: "Component library", tasks: 18 }, { name: "Documentation", tasks: 7 }];

const meta = {
  title: "Components/Data display/SortableTableHeader",
  id: "components-sortabletableheader",
  render: function SortExample(args) {
    const [, updateArgs] = useArgs<SortArgs>();
    const rows = [...projects];
    if (args.active) rows.sort((a, b) => a.name.localeCompare(b.name) * (args.direction === "asc" ? 1 : -1));
    return <Table aria-label="Sortable example projects">
      <caption>Sort example projects by name</caption>
      <thead><tr><SortableTableHeader {...args}
        directionIcon={<span aria-hidden>{args.direction === "asc" ? "\u2191" : "\u2193"}</span>}
        onSort={column => { updateArgs({ active: true }); args.onSort(column); }}
        onDirection={column => {
          updateArgs({ active: true, direction: args.direction === "asc" ? "desc" : "asc" });
          args.onDirection(column);
        }} /><th scope="col">Tasks</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.tasks}</td></tr>)}</tbody>
    </Table>;
  },
  args: { column: "name", label: "Project", active: true, direction: "asc", onSort: fn(), onDirection: fn(), directionLabel: "Reverse project name order", directionIcon: "+" },
  argTypes: {
    active: { control: "boolean" }, direction: { control: "select", options: ["asc", "desc"] },
    column: { control: false }, directionIcon: { control: false },
  },
  parameters: { docs: { description: { component: "Render inside a table header row. The name button activates sorting; the direction button reverses the example rows and updates aria-sort." } } },
} satisfies Meta<SortArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Descending: Story = { args: { direction: "desc" } };
export const Inactive: Story = { args: { active: false } };
