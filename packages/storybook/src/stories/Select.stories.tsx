import { useId, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Select } from "@wintermuted/ui-react";

type SelectArgs = ComponentProps<"select">;

const meta = {
  title: "Components/Select",
  render: function SelectExample(args) {
    const id = useId();
    const [, updateArgs] = useArgs<SelectArgs>();
    return <div className="wm-storybook-field">
      <label htmlFor={id}>Project visibility</label>
      <Select {...args} id={id} onChange={event => {
        updateArgs({ value: event.currentTarget.value });
        args.onChange?.(event);
      }}>
        <option value="private">Private</option><option value="team">Team</option><option value="public" disabled>Public (unavailable)</option>
      </Select>
    </div>;
  },
  args: { value: "private", disabled: false, onChange: fn() },
  argTypes: { value: { control: "select", options: ["private", "team"] }, disabled: { control: "boolean" } },
  parameters: { docs: { description: { component: "A labeled native select with controlled selection and an unavailable option. This does not require the optional react-select integration." } } },
} satisfies Meta<SelectArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Disabled: Story = { args: { disabled: true } };
