import { test } from "node:test";
import assert from "node:assert/strict";
import { h, render, screen, fireEvent } from "./setup.js";
const { PreviewImage } = await import("../../packages/ui-react/src/components/PreviewImage.js");

test("PreviewImage retains failure for the same source and retries each new source with a labeled fallback", () => {
  const props = { alt: "Document cover", fallbackLabel: "Cover unavailable", fallback: "No cover",
    className: "cover", fallbackClassName: "empty" };
  const view = render(h(PreviewImage, { ...props, src: "/broken.png" }));
  assert.equal(screen.getByRole("img", { name: props.alt }).getAttribute("loading"), "lazy");
  fireEvent.error(screen.getByRole("img", { name: props.alt }));
  assert.ok(screen.getByRole("img", { name: props.fallbackLabel }).classList.contains("empty"));
  view.rerender(h(PreviewImage, { ...props, src: "/broken.png", alt: "Updated cover" }));
  assert.equal(screen.queryByRole("img", { name: "Updated cover" }), null);
  view.rerender(h(PreviewImage, { ...props, src: "/new.png", loading: "eager" }));
  const image = screen.getByRole("img", { name: props.alt });
  assert.equal(image.getAttribute("src"), "/new.png");
  assert.equal(image.getAttribute("loading"), "eager");
  assert.ok(image.classList.contains("cover"));
  for (const src of [null, ""]) {
    view.rerender(h(PreviewImage, { ...props, src }));
    assert.equal(screen.getByRole("img", { name: props.fallbackLabel }).textContent, "No cover");
  }
});
