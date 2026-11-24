import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  args: { label: "Loading projects" },
  argTypes: { label: { control: "text", description: "Accessible loading announcement; the decorative indicator is hidden from assistive technology." } },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
