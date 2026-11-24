import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { ToggleGroup, type ToggleGroupProps } from "@wintermuted/ui-react";

type ToggleArgs = ToggleGroupProps<string>;

const meta = {
  title: "Components/Forms/ToggleGroup",
  id: "components-togglegroup",
  render: function ToggleExample(args) {
    const [, updateArgs] = useArgs<ToggleArgs>();
    return <ToggleGroup {...args} onChange={value => {
      updateArgs({ value });
      args.onChange(value);
    }} />;
  },
  args: {
    label: "Project view", value: "list", onChange: fn(), disabled: false,
    options: [
      { value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "calendar", label: "Calendar", disabled: true },
    ],
    orientation: "horizontal", appearance: "segmented", fullWidth: false,
  },
  argTypes: {
    value: { control: "select", options: ["list", "board"] },
    options: { control: false },
    disabled: { control: "boolean" },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    appearance: { control: "select", options: ["segmented", "outline", "swatches"] },
    fullWidth: { control: "boolean" },
  },
} satisfies Meta<ToggleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Outline: Story = { args: { appearance: "outline" } };
export const Vertical: Story = { args: { orientation: "vertical" } };
export const Disabled: Story = { args: { disabled: true } };
export const Swatches: Story = {
  args: {
    label: "Accent color", appearance: "swatches",
    options: [
      { value: "list", label: "Blue ink", swatchColor: "var(--wm-color-accent)" },
      { value: "board", label: "Green ink", swatchColor: "var(--wm-color-success)" },
    ],
  },
};
