import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Button, Toast, type ToastProps } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Feedback/Toast",
  id: "components-toast",
  component: Toast,
  render: function ToastExample(args) {
    const [, updateArgs] = useArgs<ToastProps>();
    return <div className="wm-storybook-toast-stage">
      <Button onClick={() => updateArgs({ open: true })}>Show notification</Button>
      <Toast {...args} onDismiss={() => { updateArgs({ open: false }); args.onDismiss(); }} />
    </div>;
  },
  args: { open: true, message: "Project changes saved.", tone: "success", dismissLabel: "Dismiss notification", onDismiss: fn() },
  argTypes: {
    open: { control: "boolean" }, message: { control: "text" },
    tone: { control: "select", options: ["success", "danger", "warning", "info"] }, action: { control: false },
  },
  parameters: {
    docs: {
      description: { component: "A dismissible status notification with no automatic timer. Docs isolates the fixed-position toast in its own iframe; dismiss it or reopen it with the trigger." },
      story: { inline: false, height: "360px" },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Hidden: Story = { args: { open: false } };
export const WithAction: Story = { args: { message: "Project archived.", action: <Button variant="ghost" onClick={fn()}>Undo archive</Button> } };
