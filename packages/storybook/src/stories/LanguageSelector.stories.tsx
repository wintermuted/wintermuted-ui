import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { LanguageSelector, type LanguageSelectorProps } from "@wintermuted/ui-react";

const meta = {
  title: "Components/LanguageSelector",
  component: LanguageSelector,
  render: function LanguageExample(args) {
    const [, updateArgs] = useArgs<LanguageSelectorProps>();
    return <div className={args.variant === "dropup" ? "wm-storybook-dropup-stage" : "wm-storybook-field"}>
      <LanguageSelector {...args} onChange={value => { updateArgs({ value }); args.onChange(value); }} />
    </div>;
  },
  args: {
    label: "Language", value: "en", variant: "native", onChange: fn(),
    options: [
      { value: "en", label: "English" }, { value: "es", label: "Spanish" }, { value: "ja", label: "Japanese", disabled: true },
    ],
  },
  argTypes: {
    value: { control: "select", options: ["en", "es"] }, variant: { control: "select", options: ["native", "dropup"] },
    options: { control: false },
  },
  parameters: { docs: { description: { component: "Native and dropup selectors share controlled values. The dropup supports arrows, Home/End, Escape, and trigger focus restoration. Example options are illustrative, not a list of supported application translations." } } },
} satisfies Meta<typeof LanguageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Dropup: Story = { args: { variant: "dropup" } };
export const Empty: Story = { args: { variant: "dropup", options: [], value: "" }, argTypes: { value: { control: false } } };
export const AllUnavailable: Story = {
  args: { variant: "dropup", options: [{ value: "en", label: "English", disabled: true }] },
};
