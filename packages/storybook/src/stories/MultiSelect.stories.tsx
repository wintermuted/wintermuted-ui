import { useId } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { MultiSelect, type MultiSelectProps } from "@wintermuted/ui-react/select";

interface Option { value: string; label: string }
type SelectArgs = MultiSelectProps<Option, true>;

const options: Option[] = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "documentation", label: "Documentation" },
];

function MultiSelectExample(args: SelectArgs) {
  const id = useId();
  const [, updateArgs] = useArgs<SelectArgs>();
  return <div className="wm-storybook-field">
    <label htmlFor={id}>Project teams</label>
    <MultiSelect<Option, true> {...args} inputId={id} onChange={(value, action) => {
      updateArgs({ value });
      args.onChange?.(value, action);
    }} />
  </div>;
}

const meta = {
  title: "Components/MultiSelect",
  render: MultiSelectExample,
  args: {
    options,
    value: [],
    placeholder: "Choose teams",
    isDisabled: false,
    onChange: fn(),
  },
  argTypes: {
    options: { control: false },
    value: { control: "object", description: "Selected option objects; selections also update Controls." },
    placeholder: { control: "text" },
    isDisabled: { control: "boolean" },
  },
  parameters: {
    docs: { description: { component: "The optional react-select integration, imported from @wintermuted/ui-react/select. The example adds an associated label and typed multi-selection options." } },
  },
} satisfies Meta<SelectArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Selected: Story = { args: { value: [options[0], options[1]] } };
export const Disabled: Story = { args: { value: [options[0]], isDisabled: true } };
