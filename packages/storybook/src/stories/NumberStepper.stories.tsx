import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { NumberStepper, type NumberStepperProps } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Forms/NumberStepper",
  id: "components-numberstepper",
  component: NumberStepper,
  render: function StepperExample(args) {
    const [, updateArgs] = useArgs<NumberStepperProps>();
    return <NumberStepper {...args} onChange={value => { updateArgs({ value }); args.onChange(value); }} />;
  },
  args: {
    value: 3, min: 0, max: 10, step: 1, disabled: false, onChange: fn(),
    label: "Example task estimate", decreaseLabel: "Decrease estimate", increaseLabel: "Increase estimate",
    valueLabel: "Current estimate", decreaseIcon: "-", increaseIcon: "+", tooltipPlacement: "above",
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 10, step: 0.25 } },
    step: { control: "select", options: [0.25, 1, 2] }, disabled: { control: "boolean" },
    min: { control: false }, max: { control: false }, decreaseIcon: { control: false }, increaseIcon: { control: false },
    tooltipPlacement: { control: "select", options: ["above", "right"] },
  },
  decorators: [(Story) => <div className="wm-storybook-tooltip-stage"><Story /></div>],
  parameters: { docs: { description: { component: "Controlled numeric stepping, bounded to 0-10 in these examples. Boundary buttons disable automatically. Change step to exercise fractional values." } } },
} satisfies Meta<typeof NumberStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Fractional: Story = { args: { value: 0.5, step: 0.25 } };
export const AtMaximum: Story = { args: { value: 10 } };
export const Disabled: Story = { args: { disabled: true } };
