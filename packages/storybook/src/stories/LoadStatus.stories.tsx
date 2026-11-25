import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Button, LoadStatus, Tooltip } from "@wintermuted/ui-react";

const meta = {
  title: "Components/Feedback/LoadStatus",
  id: "components-loadstatus",
  component: LoadStatus,
  args: { issues: [], warnings: [], loading: false, labels: { retry: "Retry records", loading: "Loading records" } },
  argTypes: {
    loading: { control: "boolean" }, issues: { control: false }, warnings: { control: "object" },
    labels: { control: "object" }, renderHelp: { control: false },
    retryIcon: { control: false }, loadingIcon: { control: false },
  },
  parameters: { docs: { description: { component: "Context-free loading, error and warning announcements. The host supplies messages, retries and optional help positioning. Retry does not bubble into surrounding disclosures." } } },
} satisfies Meta<typeof LoadStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const Loading: Story = { args: { loading: true } };
export const Warning: Story = { args: { warnings: ["Some records are incomplete."] } };
export const LoadingWithWarning: Story = { args: { loading: true, warnings: ["Some records are incomplete."] } };
export const ErrorWithRetry: Story = { args: { issues: [{ message: "Records could not be loaded.", retry: fn() }] } };
export const Recovering: Story = { args: { loading: true, issues: [{ message: "Records could not be loaded.", retry: fn() }] } };
export const WithHelp: Story = {
  args: {
    warnings: ["Archived records are excluded."],
    renderHelp: ({ message }) => <Tooltip text={message}><Button variant="ghost" aria-label="About excluded records">?</Button></Tooltip>,
  },
};
