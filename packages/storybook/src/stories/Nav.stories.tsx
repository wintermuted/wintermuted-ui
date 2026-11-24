import { useId } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { Nav } from "@wintermuted/ui-react";

type NavArgs = { current: string };
const pages = ["Overview", "Activity", "Settings"];

const meta = {
  title: "Components/Nav",
  render: function NavExample(args) {
    const id = useId();
    const [, updateArgs] = useArgs<NavArgs>();
    return <div className="wm-storybook-stack">
      <Nav aria-label="Project sections">
        {pages.map(page => <a key={page} href={`#${id}`} aria-current={args.current === page ? "page" : undefined}
          onClick={event => { event.preventDefault(); updateArgs({ current: page }); }}>{page}</a>)}
      </Nav>
      <p id={id} role="status">{args.current} section selected.</p>
    </div>;
  },
  args: { current: "Overview" },
  argTypes: { current: { control: "select", options: pages } },
  parameters: { docs: { description: { component: "A native nav landmark with wrapping links. This local example changes the active section without navigating away from Storybook." } } },
} satisfies Meta<NavArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
