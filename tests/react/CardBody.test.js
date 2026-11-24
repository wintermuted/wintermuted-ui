import { testPrimitive } from "./primitive.js";
const { CardBody } = await import("../../packages/ui-react/src/components/CardBody.js");

testPrimitive("CardBody", CardBody, "div", "wm-card-body");
