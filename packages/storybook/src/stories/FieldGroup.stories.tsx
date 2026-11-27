import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldGroup, Input } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Forms/FieldGroup",
  id: "components-fieldgroup",
  component: FieldGroup,
  args: { label: "Project name", hint: "Use a name your team will recognize.", error: "", children: <Input placeholder="e.g. Component library" /> },
  argTypes: {
    label: { control: "text" }, hint: { control: "text" }, error: { control: "text" }, children: { control: false },
  },
  decorators: [(Story) => <div className="wm-storybook-field"><Story /></div>],
  parameters: { docs: { description: { component: "FieldGroup connects the label and independent hint/error nodes to one control, generating unique IDs when needed. Both descriptions remain visible when an error marks the control invalid. Use hintId/errorId to keep explicit description IDs." } } },
} satisfies Meta<typeof FieldGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const ValidationError: Story = { args: { error: "Enter a project name before saving." } };
export const ExplicitDescriptions: Story = {
  args: {
    hintId: "storybook-project-hint", errorId: "storybook-project-error",
    error: <span role="alert">This project name is already in use.</span>,
  },
};
export const Disabled: Story = { args: { children: <Input defaultValue="Archived project" disabled /> } };
