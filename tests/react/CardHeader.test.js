import { testPrimitive } from "./primitive.js";
const { CardHeader } = await import("../../packages/ui-react/src/components/CardHeader.js");

testPrimitive("CardHeader", CardHeader, "header", "wm-card-header");
