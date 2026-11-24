import { testPrimitive } from "./primitive.js";
const { Nav } = await import("../../packages/ui-react/src/components/Nav.js");

testPrimitive("Nav", Nav, "nav", "wm-nav", { "aria-label": "Primary" });
