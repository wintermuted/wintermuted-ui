import React, { createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Accordion, Alert, Badge, Button, Card, CardHeader, CardBody, CardTitle, CardText, CardFooter,
  Dialog, FieldGroup, Input, Select, ListGroup, ListItem, Menu, Nav, ProgressBar, Spinner,
  Table, Tabs, ThemeProvider, ThemeSelect, Tooltip,
} from "@wintermuted/ui-react";
import { MultiSelect } from "@wintermuted/ui-react/select";
import { initTheme } from "@wintermuted/ui-react/theme";

const storageKey = "wintermuted:react-showcase:theme";
initTheme({ storageKey });
const section = (title, ...children) => h("section", { className: "react-doc-section" }, h("h3", null, title), ...children);

function Showcase() {
  const [dialog, setDialog] = useState(false);
  const [message, setMessage] = useState("Choose an action to see feedback.");
  const [stops, setStops] = useState([]);
  return h(ThemeProvider, { storageKey },
    section("Appearance", h(ThemeSelect)),
    section("Actions and feedback",
      h("div", { className: "react-demo-actions" },
        h(Button, { onClick: () => setMessage("Arrivals refreshed.") }, "Refresh arrivals"),
        h(Button, { variant: "secondary", disabled: true }, "Unavailable"),
        h(Tooltip, { text: "Opens a keyboard-accessible modal dialog" },
          h(Button, { variant: "ghost", onClick: () => setDialog(true) }, "Open dialog")),
        h(Menu, { label: "More actions", items: [
          { id: "refresh", label: "Refresh", onSelect: () => setMessage("Arrivals refreshed from menu.") },
          { id: "disabled", label: "Export unavailable", disabled: true },
          { id: "docs", label: "Read installation guide", href: "./installation.html" },
        ] })),
      h(Alert, null, message),
      h("div", { className: "react-demo-actions" },
        h(Badge, { tone: "success" }, "Live"), h(Badge, { tone: "warning" }, "Delayed"),
        h(Badge, { tone: "danger" }, "Cancelled"), h(Spinner, { label: "Fetching arrivals" })),
      h(ProgressBar, { value: 65, label: "Refresh progress" })),
    section("Fields",
      h("div", { className: "react-demo-fields" },
        h(FieldGroup, { label: "Stop name", hint: "Enter part of a stop name." }, h(Input, { placeholder: "e.g. Main Street" })),
        h(FieldGroup, { label: "Direction" }, h(Select, null,
          h("option", null, "All directions"), h("option", null, "Northbound"), h("option", null, "Southbound"))),
        h(FieldGroup, { label: "Stop number", error: "Enter a numeric stop number." }, h(Input, { defaultValue: "ABC" })),
        h(FieldGroup, { label: "Search stops", hint: "Select one or more stops." },
          h(MultiSelect, {
            options: [{ value: 1, label: "North at Main" }, { value: 2, label: "South at Main" }],
            value: stops, onChange: setStops,
          })))),
    section("Surfaces and lists",
      h(Card, null, h(CardHeader, null, h(CardTitle, null, "Selected stops"), h(Badge, null, stops.length)),
        h(CardBody, null, h(CardText, null, "Keep content semantic and compose only the slots you need.")),
        h(ListGroup, null, h(ListItem, null, "North at Main"), h(ListItem, null, "South at Main")),
        h(CardFooter, null, h(Button, { size: "sm", variant: "secondary", onClick: () => setDialog(true) }, "View details")))),
    section("Navigation and disclosure",
      h(Nav, { "aria-label": "Example links" }, h("a", { href: "./react.html", "aria-current": "page" }, "React"),
        h("a", { href: "./components.html" }, "CSS components")),
      h(Tabs, { label: "Example views", items: [
        { id: "arrivals", label: "Arrivals", content: "Arrival information stays mounted when switching views." },
        { id: "unavailable", label: "Unavailable", disabled: true, content: "Unavailable" },
        { id: "routes", label: "Routes", content: "Route information." },
      ] }),
      h(Accordion, { title: "Keyboard instructions" }, "Use Enter or Space to toggle this disclosure.")),
    section("Tables",
      h(Table, { responsive: true, "aria-label": "Example arrivals" },
        h("caption", null, "Example arrivals"),
        h("thead", null, h("tr", null, h("th", { scope: "col" }, "Route"), h("th", { scope: "col" }, "Destination"),
          h("th", { scope: "col" }, "Due"))),
        h("tbody", null, h("tr", null, h("td", null, "12"), h("td", null, "City center"), h("td", null, "3 min"))))),
    h(Dialog, { open: dialog, onClose: () => setDialog(false), title: "Stop details" },
      h("div", { className: "react-demo-stack" }, h("p", null, "Focus stays inside this dialog. Escape returns to the opener."),
        h(FieldGroup, { label: "Stop notes" }, h(Input)),
        h(Button, { onClick: () => setDialog(false) }, "Done"))));
}

createRoot(document.getElementById("react-showcase")).render(h(React.StrictMode, null, h(Showcase)));
