import { testPrimitive } from "./primitive.js";
const { CardText } = await import("../../packages/ui-react/src/components/CardText.js");

testPrimitive("CardText", CardText, "p", "wm-card-text");
