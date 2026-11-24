import { testPrimitive } from "./primitive.js";
const { Card } = await import("../../packages/ui-react/src/components/Card.js");

testPrimitive("Card", Card, "section", "wm-card");
