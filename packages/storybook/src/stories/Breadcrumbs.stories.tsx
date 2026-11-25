import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Navigation/Breadcrumbs",
  id: "components-breadcrumbs",
  component: Breadcrumbs,
  args: { label: "Document trail", items: [
    { id: "library", label: "Library", href: "#library" },
    { id: "documents", label: "Documents", href: "#documents" },
    { id: "notes", label: "Notes" },
  ] },
  argTypes: { renderLink: { control: false } },
  parameters: { docs: { description: { component: "Ordered navigation built on Nav. Supply stable IDs and a navigation label; renderLink adapts hrefs to any router without importing it." } } },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const CustomLink: Story = {
  args: { renderLink: item => <a href={item.href} title={`Open ${item.label}`}>{item.label}</a> },
};
