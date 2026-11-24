import { after, afterEach, beforeEach } from "node:test";
import { register } from "node:module";
import { JSDOM } from "jsdom";
import React, { createElement as h } from "react";

register("../../scripts/react-test-loader.mjs", import.meta.url);

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://example.test/", runScripts: "outside-only",
});
for (const name of ["window", "document", "Element", "HTMLElement", "SVGElement", "HTMLInputElement", "HTMLDialogElement", "Node", "MutationObserver",
  "getComputedStyle", "Event", "MouseEvent", "KeyboardEvent"]) {
  globalThis[name] = name === "getComputedStyle" ? dom.window.getComputedStyle.bind(dom.window) : dom.window[name];
}
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let dark = false;
const media = new dom.window.EventTarget();
Object.defineProperty(media, "matches", { get: () => dark });
window.matchMedia = () => media;
HTMLDialogElement.prototype.showModal = function () { this.open = true; this.querySelector("button")?.focus(); };
HTMLDialogElement.prototype.close = function () {
  this.open = false;
  // Native close events arrive after React's effect cleanup has finished.
  queueMicrotask(() => this.dispatchEvent(new Event("close")));
};
const { render, screen, cleanup, fireEvent, act } = await import("@testing-library/react");
const { default: userEvent } = await import("@testing-library/user-event");
const theme = await import("@wintermuted/ui-react/theme");

beforeEach(() => {
  dark = false;
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("color-scheme");
});
afterEach(cleanup);
after(() => dom.window.close());

async function setSystemTheme(isDark) {
  await act(() => { dark = isDark; media.dispatchEvent(new Event("change")); });
}

export { React, h, dom, media, render, screen, fireEvent, act, userEvent, theme, setSystemTheme };
