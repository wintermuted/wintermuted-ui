import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, ListGroup, ListItem } from "@wintermuted/ui-react";

const meta = {
  title: "Components/ListGroup",
  component: ListGroup,
  subcomponents: { ListItem },
  argTypes: { children: { control: false }, as: { control: false } },
  render: () => <ListGroup aria-label="Project checklist">
    <ListItem>Define component contracts</ListItem>
    <ListItem>Document accessible interactions</ListItem>
    <ListItem>Publish examples</ListItem>
  </ListGroup>,
  parameters: { docs: { description: { component: "ListGroup and ListItem preserve native list semantics and support native attributes and polymorphic elements." } } },
} satisfies Meta<typeof ListGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const ItemWithStatus: Story = {
  render: () => <ListGroup aria-label="Project tasks"><ListItem>
    <span>Component documentation</span><Badge tone="success">Complete</Badge>
  </ListItem></ListGroup>,
};
export const Ordered: Story = {
  render: () => <ListGroup as="ol" aria-label="Release steps">
    <ListItem>Review changes</ListItem><ListItem>Run compatibility checks</ListItem><ListItem>Publish release</ListItem>
  </ListGroup>,
};
