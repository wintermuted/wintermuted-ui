import { testPrimitive } from "./primitive.js";
const { CardTitle } = await import("../../packages/ui-react/src/components/CardTitle.js");

testPrimitive("CardTitle", CardTitle, "h3", "wm-card-title");
