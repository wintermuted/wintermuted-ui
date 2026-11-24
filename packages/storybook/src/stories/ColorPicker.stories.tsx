import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { ColorPicker, type ColorPickerProps } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Forms/ColorPicker",
  id: "components-colorpicker",
  component: ColorPicker,
  render: function ColorExample(args) {
    const [, updateArgs] = useArgs<ColorPickerProps>();
    return <div className="wm-storybook-popover-stage"><ColorPicker {...args}
      onChange={value => { updateArgs({ value }); args.onChange(value); }}
      onSelect={(value, group, index) => { updateArgs({ value }); args.onSelect(value, group, index); }}
    /></div>;
  },
  args: {
    value: "#304f91", label: "Project accent", inputLabel: "Custom accent color",
    hexLabel: "Hex color", invalidLabel: "Enter a six-digit hex color, such as #304f91.",
    onChange: fn(), onSelect: fn(), onCommit: fn(), placement: "above", disabled: false,
    groups: [{
      id: "ink", label: "Ink colors", choices: [
        { value: "#304f91", label: "Blue ink" }, { value: "#1d7249", label: "Green ink" }, { value: "#a84838", label: "Red ink" },
      ],
    }],
  },
  argTypes: {
    value: { control: "text", description: "A six-digit hex color (#RRGGBB)." },
    groups: { control: false }, disabled: { control: "boolean" },
    placement: { control: "select", options: ["above", "right"] },
    draftValue: { control: false }, onDraftChange: { control: false },
  },
  parameters: { docs: { description: { component: "Open the swatch trigger, choose a preset, or enter a custom hex color. Invalid input reports an inline error; Enter commits a valid hex and Escape closes the picker. Blank space above the trigger accommodates its upward-opening panel." } } },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Right: Story = { args: { placement: "right" } };
export const Disabled: Story = { args: { disabled: true } };
