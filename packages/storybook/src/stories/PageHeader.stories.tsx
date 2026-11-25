import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, PageHeader } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Layout/PageHeader",
  id: "components-pageheader",
  component: PageHeader,
  args: { title: "Documents", description: "Browse and manage shared documents.", action: <Button>Create document</Button> },
  argTypes: { action: { control: false }, icon: { control: false }, classNames: { control: false } },
  parameters: { docs: { description: { component: "An h1 page header using canonical view-header styles. Copy, optional decorative icon and actions belong to the application." } } },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const TitleOnly: Story = { args: { description: undefined, action: undefined } };
export const LongTitle: Story = { args: { title: "Shared documents and reference materials for the entire organization" } };
