import { testPrimitive } from "./primitive.js";
const { ListGroup } = await import("../../packages/ui-react/src/components/ListGroup.js");

testPrimitive("ListGroup", ListGroup, "ul", "wm-list-group");
