import { useId, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Input } from "@wintermuted/ui-react";

type InputArgs = ComponentProps<"input">;

function InputExample(args: InputArgs) {
  const id = useId();
  const [, updateArgs] = useArgs<InputArgs>();
  return <div className="wm-storybook-field">
    <label htmlFor={id}>Project name</label>
    <Input {...args} id={id} onChange={event => {
      updateArgs({ value: event.currentTarget.value });
      args.onChange?.(event);
    }} />
  </div>;
}

const meta = {
  title: "Components/Input",
  render: InputExample,
  args: { value: "", placeholder: "e.g. Wintermuted", disabled: false, onChange: fn() },
  argTypes: {
    value: { control: "text", description: "Controlled input value; typing also updates Controls." },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
  parameters: {
    docs: { description: { component: "A native input styled with the theme. The example adds an associated label and keeps its value synchronized with Controls." } },
  },
} satisfies Meta<InputArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Filled: Story = { args: { value: "Wintermuted UI" } };
export const Disabled: Story = { args: { value: "Read-only example", disabled: true } };
