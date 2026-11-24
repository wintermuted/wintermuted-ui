import { test } from "node:test";
import assert from "node:assert/strict";
import { React, h, render, screen, fireEvent } from "./setup.js";

export function testPrimitive(name, Component, tag, baseClass, nativeProps = {}) {
  test(`${name} preserves its semantic element, native props, class composition, and ref`, () => {
    const ref = React.createRef();
    let clicked;
    const { container } = render(h(Component, {
      ...nativeProps, ref, className: "custom", title: "Native title", "data-testid": "primitive",
      style: { marginTop: "3px" }, onClick: event => { clicked = event.currentTarget; },
    }, tag === "input" ? undefined : tag === "select" ? h("option", null, "Content") : "Content"));
    const element = screen.getByTestId("primitive");
    assert.equal(element.tagName.toLowerCase(), tag);
    assert.equal(ref.current, element);
    assert.ok(element.classList.contains(baseClass));
    assert.ok(element.classList.contains("custom"));
    assert.equal(element.title, "Native title");
    assert.equal(element.style.marginTop, "3px");
    assert.equal(container.firstElementChild, element);
    if (tag !== "input") assert.equal(element.textContent, "Content");
    for (const [key, value] of Object.entries(nativeProps)) assert.equal(element.getAttribute(key), String(value));
    fireEvent.click(element);
    assert.equal(clicked, element);
  });

  test(`${name} forwards custom-component props and refs through as`, () => {
    const ref = React.createRef();
    const Link = React.forwardRef(function Link({ destination, ...props }, forwarded) {
      return h("a", { ...props, ref: forwarded, href: destination });
    });
    render(h(Component, { as: Link, destination: "#destination", ref, className: "custom" }, "Visit"));
    const link = screen.getByRole("link", { name: "Visit" });
    assert.equal(link.getAttribute("href"), "#destination");
    assert.equal(ref.current, link);
    assert.ok(link.classList.contains(baseClass));
    assert.ok(link.classList.contains("custom"));
  });
}
