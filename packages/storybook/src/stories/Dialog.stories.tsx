import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Button, Dialog } from "@wintermuted/ui-react";

type DialogProps = ComponentProps<typeof Dialog>;

function DialogExample(args: DialogProps) {
  const [, updateArgs] = useArgs<DialogProps>();
  return <>
    <Button onClick={() => updateArgs({ open: true })}>Open dialog</Button>
    <Dialog {...args} onClose={() => {
      updateArgs({ open: false });
      args.onClose();
    }} />
  </>;
}

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  render: DialogExample,
  args: {
    open: false,
    title: "Project details",
    children: "This native dialog traps focus and returns it to its trigger when dismissed.",
    onClose: fn(),
  },
  argTypes: {
    open: { control: "boolean" },
    title: { control: "text" },
    children: { control: "text" },
  },
  parameters: {
    docs: { description: { component: "Open the dialog with its trigger or the open control. Close it with the Close button or Escape, and check focus returns to the trigger. In Docs, modal content is confined to its example iframe." }, story: { inline: false, height: "360px" } },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
