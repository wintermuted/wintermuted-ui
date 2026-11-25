import React, { createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ColorPicker, Dialog, FilterPanel, Input } from "@wintermuted/ui-react";

function ReviewFixture() {
  const [dialog, setDialog] = useState(false);
  const [color, setColor] = useState("#2a4a8a");
  const filters = label => h(FilterPanel, {
    labels: { toggle: `Open ${label}`, panel: label, title: label, dismiss: `Dismiss ${label}`, close: `Close ${label}` },
    search: h(Input, { "aria-label": `Search ${label}` }),
  },
  h(ColorPicker, {
    label: `${label} ink`, inputLabel: `${label} color`, hexLabel: `${label} hex`, invalidLabel: "Invalid color",
    value: color, onChange: setColor, onSelect: setColor,
    groups: [{ id: "ink", label: "Ink choices", choices: [{ value: "#137333", label: `${label} green` }] }],
  }),
  ...Array.from({ length: label === "Long filters" ? 24 : 1 }, (_, index) =>
    h("label", { key: index }, `${label} field ${index}`, h(Input, { "aria-label": `${label} field ${index}` }))));
  return h(React.Fragment, null,
    h(Button, { onClick: () => setDialog(true) }, "Open containing dialog"),
    h(Dialog, { title: "Containing dialog", open: dialog, onClose: () => setDialog(false) }, filters("Nested filters")),
    filters("Long filters"));
}

document.querySelector("#react-showcase").replaceChildren();
createRoot(document.querySelector("#react-showcase")).render(h(ReviewFixture));
