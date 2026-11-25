import type { Meta, StoryObj } from "@storybook/react-vite";
import { PreviewImage } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Data/PreviewImage",
  id: "components-previewimage",
  component: PreviewImage,
  args: { src: null, alt: "Document cover", fallbackLabel: "Cover unavailable", fallback: "No cover available" },
  render: args => <div style={{ maxWidth: "24rem" }}><PreviewImage {...args} /></div>,
  argTypes: { loading: { control: "select", options: ["lazy", "eager"] } },
  parameters: { docs: { description: { component: "Labeled missing/failed-image fallback with canonical gallery sizing. Changing src retries the image; an unchanged failed URL remains failed. Applications supply real image URLs and fallback content." } } },
} satisfies Meta<typeof PreviewImage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Missing: Story = {};
export const Failed: Story = { args: { src: "/missing-document-cover.png", loading: "eager" } };
