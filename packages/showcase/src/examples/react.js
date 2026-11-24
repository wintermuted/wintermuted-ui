import React, { createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Accordion, Alert, Badge, Button, Card, CardHeader, CardBody, CardTitle, CardText, CardFooter,
  Dialog, FieldGroup, Input, Select, ListGroup, ListItem, Menu, Nav, ProgressBar, Spinner,
  Table, Tabs, ThemeProvider, ThemeSelect, Tooltip, ToggleGroup, FacetFilter, SortableTableHeader,
  StatCard, RankedBarList, Toast, ColorPicker, NumberStepper, LanguageSelector,
} from "@wintermuted/ui-react";
import { MultiSelect } from "@wintermuted/ui-react/select";
import { initTheme } from "@wintermuted/ui-react/theme";

const storageKey = "wintermuted:react-showcase:theme";
initTheme({ storageKey });
const section = (title, ...children) => h("section", { className: "react-doc-section" }, h("h3", null, title), ...children);

function ReusableControls() {
  const [view, setView] = useState("orders");
  const [departments, setDepartments] = useState(["all"]);
  const [quantity, setQuantity] = useState(0.5);
  const [color, setColor] = useState("#2a4a8a");
  const [draft, setDraft] = useState(color);
  const [language, setLanguage] = useState("ja");
  const [notice, setNotice] = useState(false);
  const [column, setColumn] = useState("amount");
  const [direction, setDirection] = useState("asc");
  const languages = [{ value: "ja", label: "Japanese" }, { value: "sv", label: "Swedish", disabled: true },
    { value: "de", label: "German" }];
  return section("Reusable controls and metrics",
    h("p", null, "Supply values, labels and callbacks. Your application owns filtering, formatting, locale changes and notification timing."),
    h("div", { className: "react-demo-actions" },
      h(ToggleGroup, { label: "Documents", value: view, onChange: setView, appearance: "outline", options: [
        { value: "orders", label: "Orders" }, { value: "returns", label: "Returns" },
        { value: "archive", label: "Archive", disabled: true }] }),
      h(NumberStepper, { label: "Quantity", value: quantity, min: 0, max: 1, step: 0.1, onChange: setQuantity,
        decreaseLabel: "Decrease quantity", increaseLabel: "Increase quantity", valueLabel: "Current quantity",
        decreaseIcon: "-", increaseIcon: "+" }),
      h(ColorPicker, { label: "Ink", inputLabel: "Pick ink", hexLabel: "Ink hex", invalidLabel: "Use six hexadecimal digits",
        value: color, draftValue: draft, onDraftChange: setDraft, onChange: setColor,
        onSelect: value => setColor(value), onCommit: () => setNotice(true),
        groups: [{ id: "brand", label: "Brand", choices: [
          { value: "#2a4a8a", label: "Blue ink" }, { value: "#137333", label: "Green ink" }] }] }),
      h(LanguageSelector, { options: languages, value: language, onChange: setLanguage, label: "Native locale" }),
      h(LanguageSelector, { options: languages, value: language, onChange: setLanguage, label: "Popup locale", variant: "dropup" })),
    h("div", { className: "react-demo-fields" },
      h(FacetFilter, { label: "Departments", selected: departments, onChange: setDepartments, available: true,
        emptyLabel: "No departments", moreLabel: "More departments", fewerLabel: "Fewer departments",
        reset: { label: "Any department", count: 4, selected: departments.length === 0, onSelect: () => setDepartments([]) },
        options: [{ value: "all", label: "All Services", count: 0, disabled: !departments.includes("all") },
          { value: "support", label: "Support", count: 4 }, { value: "closed", label: "Closed", count: 0, hidden: true, disabled: true }] }),
      h(StatCard, { label: "Quarterly orders", value: 0, variant: "compact", tone: "success" },
        h(RankedBarList, { label: "Department ranking", maximum: 100, minimumWidthPercent: 6, empty: "No departments",
          items: [{ id: "shipping", label: "Shipping", value: 50, valueLabel: "50 orders", color },
            { id: "returns", label: "Returns", value: 1, valueLabel: "1 order" }] }))),
    h(Table, { responsive: true, "aria-label": "Sortable invoices" },
      h("caption", null, `Sort requested: ${column}, ${direction}. Applications supply the sorted rows.`),
      h("thead", null, h("tr", null, ...[["vendor", "Vendor"], ["amount", "Amount"]].map(([key, label]) =>
        h(SortableTableHeader, { key, column: key, label, active: column === key, direction,
          onSort: setColumn, onDirection: key => { setColumn(key); setDirection(direction === "asc" ? "desc" : "asc"); },
          directionLabel: `Reverse ${label.toLowerCase()}`, directionIcon: direction === "asc" ? "^" : "v" })))),
      h("tbody", null, h("tr", null, h("td", null, "Shipping"), h("td", null, "50")))),
    h(Button, { variant: "secondary", onClick: () => setNotice(true) }, "Show notice"),
    h(Toast, { open: notice, message: "Preferences saved", dismissLabel: "Dismiss notice", onDismiss: () => setNotice(false),
      action: h("a", { href: "#react-showcase", onClick: () => setNotice(false) }, "View controls") }));
}

function Showcase() {
  const [dialog, setDialog] = useState(false);
  const [message, setMessage] = useState("Choose an action to see feedback.");
  const [stops, setStops] = useState([]);
  return h(ThemeProvider, { storageKey },
    section("Appearance", h(ThemeSelect)),
    h(ReusableControls),
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
