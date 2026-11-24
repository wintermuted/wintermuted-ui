import { testPrimitive } from "./primitive.js";
const { ListItem } = await import("../../packages/ui-react/src/components/ListItem.js");

testPrimitive("ListItem", ListItem, "li", "wm-list-item", { value: 3 });
