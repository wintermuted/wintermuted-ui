import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Table",
  component: Table,
  args: { responsive: true, "aria-label": "Example project status" },
  argTypes: { responsive: { control: "boolean" }, children: { control: false } },
  render: args => <Table {...args}>
    <caption>Example projects</caption>
    <thead><tr><th scope="col">Project</th><th scope="col">Owner</th><th scope="col">Status</th></tr></thead>
    <tbody>
      <tr><th scope="row">Component library</th><td>Design systems</td><td>Published</td></tr>
      <tr><th scope="row">Documentation</th><td>Developer experience</td><td>In review</td></tr>
    </tbody>
  </Table>,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Empty: Story = {
  render: args => <Table {...args}><caption>Example projects</caption>
    <thead><tr><th scope="col">Project</th><th scope="col">Status</th></tr></thead>
    <tbody><tr><td colSpan={2}>No projects match your filters.</td></tr></tbody>
  </Table>,
};
