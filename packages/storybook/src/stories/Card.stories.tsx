import type { ComponentPropsWithoutRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Button, Card, CardHeader, CardBody, CardTitle, CardText, CardFooter } from "@wintermuted/ui-react";

type CardArgs = ComponentPropsWithoutRef<"section"> & { as?: "section" };

const meta = {
  title: "Components/Layout/Card",
  id: "components-card",
  component: Card,
  subcomponents: { CardHeader, CardBody, CardTitle, CardText, CardFooter },
  args: { children: "A composed card keeps related content and actions together." },
  argTypes: { children: { control: "text", description: "Body copy inside CardText." }, as: { control: false } },
  render: args => <Card {...args}>
    <CardHeader><CardTitle>Project overview</CardTitle></CardHeader>
    <CardBody><CardText>{args.children}</CardText></CardBody>
    <CardFooter><Button variant="secondary" onClick={fn()}>View project</Button></CardFooter>
  </Card>,
  parameters: {
    docs: { description: { component: "Card composes CardHeader, CardBody, CardTitle, CardText, and CardFooter. Named examples show each slot in its semantic context; the primitives also accept native props and an as element." } },
  },
} satisfies Meta<CardArgs>;

export default meta;
type Story = StoryObj<CardArgs>;

export const Playground: Story = {};
export const Header: Story = {
  render: () => <Card><CardHeader><CardTitle>Project header</CardTitle><p>Owner: Design team</p></CardHeader></Card>,
};
export const Body: Story = {
  render: args => <Card><CardBody><CardText>{args.children}</CardText></CardBody></Card>,
};
export const Title: Story = {
  render: () => <Card><CardBody><CardTitle as="h2">A semantic heading</CardTitle><CardText>The title can match the surrounding document hierarchy.</CardText></CardBody></Card>,
};
export const Text: Story = {
  render: args => <Card><CardBody><CardText>{args.children}</CardText><CardText>Additional paragraphs retain the same typography.</CardText></CardBody></Card>,
};
export const Footer: Story = {
  render: () => <Card><CardBody><CardText>Review the project before publishing.</CardText></CardBody>
    <CardFooter><Button onClick={fn()}>Publish project</Button><Button variant="ghost" onClick={fn()}>Cancel</Button></CardFooter></Card>,
};
