import { testPrimitive } from "./primitive.js";
const { CardFooter } = await import("../../packages/ui-react/src/components/CardFooter.js");

testPrimitive("CardFooter", CardFooter, "footer", "wm-card-footer");
