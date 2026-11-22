import { cpSync, mkdirSync, rmSync } from "node:fs";

const source = new URL("../packages/ui-react/src/", import.meta.url);
const target = new URL("../packages/ui-theme/react/", import.meta.url);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
