# Task-oriented React recipes

These compositions use public `@wintermuted/ui-react` APIs and explicit `@wintermuted/ui-theme/index.css` imports. Install both packages plus React and React DOM as described in the [agent usage guide](https://github.com/wintermuted/wintermuted-ui/blob/main/docs/agent-usage.md). Check the installed exports and declarations: source documentation can precede npm releases.

Each recipe is independent. The application owns validation, records, sorting, filtering, persistence callbacks, and theme initialization. No react-select dependency or removed theme React entry point is used.

## Build a validated form

Save this as `ContactForm.tsx`. Supply `onSave` from your application's API/storage layer; it receives only valid, trimmed values. The form retains its draft on failure, announces errors, and disables repeat submissions while saving. `FieldGroup` associates both hints and errors with the native input; validation rules and submit state are application-owned.

```tsx
import "@wintermuted/ui-theme/index.css";
import { useRef, useState, type FormEvent } from "react";
import { Alert, Button, FieldGroup, Input } from "@wintermuted/ui-react";

export function ContactForm({ onSave }: {
  onSave: (contact: { name: string; email: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const nameError = name.trim() ? undefined : "Enter a name.";
  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? undefined : "Enter a valid email address.";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    setNotice(null);
    if (nameError || emailError) {
      (nameError ? nameRef : emailRef).current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), email: email.trim() });
      setNotice({ error: false, text: "Contact saved." });
    } catch (error) {
      setNotice({ error: true, text: error instanceof Error ? error.message : "Could not save the contact." });
    } finally {
      setSaving(false);
    }
  }

  return <form noValidate onSubmit={submit} aria-busy={saving}>
    <fieldset disabled={saving}>
      <legend>Contact details</legend>
      <FieldGroup label="Name" hint="Use the name shown on correspondence."
        error={submitted ? nameError : undefined}>
        <Input ref={nameRef} name="name" autoComplete="name" required
          value={name} onChange={event => { setName(event.target.value); setNotice(null); }} />
      </FieldGroup>
      <FieldGroup label="Email" hint="We will use this address to contact you."
        error={submitted ? emailError : undefined}>
        <Input ref={emailRef} name="email" type="email" autoComplete="email" required
          value={email} onChange={event => { setEmail(event.target.value); setNotice(null); }} />
      </FieldGroup>
      <Button type="submit">{saving ? "Saving contact..." : "Save contact"}</Button>
    </fieldset>
    {submitted && (nameError || emailError)
      ? <Alert tone="danger" role="alert">Correct the indicated fields before saving.</Alert> : null}
    {notice ? <Alert tone={notice.error ? "danger" : "success"}
      role={notice.error ? "alert" : "status"}>{notice.text}</Alert> : null}
  </form>;
}
```

The email rule is a deliberately small application policy, not proof that an address exists. Repeat validation on the server. Keep callback error messages safe for display; do not expose internal exception details from your API.

## Create a sortable table

Save this as `InvoiceTable.tsx` and pass records from the application. `SortableTableHeader` is already a `th`, so put it directly inside `tr`. The application selects the column/direction and sorts a copy of the records; the component only supplies accessible header controls. Clicking a column selects ascending order; its separate direction button reverses the active sort or selects descending order for an inactive column.

```tsx
import "@wintermuted/ui-theme/index.css";
import { useState } from "react";
import { SortableTableHeader, Table } from "@wintermuted/ui-react";

type Invoice = { id: string; customer: string; total: number };
type SortKey = "customer" | "total";
type Sort = { key: SortKey; direction: "asc" | "desc" };

export function InvoiceTable({ invoices }: { invoices: readonly Invoice[] }) {
  const [sort, setSort] = useState<Sort>({ key: "customer", direction: "asc" });
  const rows = [...invoices].sort((left, right) => {
    const comparison = sort.key === "total"
      ? left.total - right.total : left.customer.localeCompare(right.customer, "en");
    return (sort.direction === "asc" ? comparison : -comparison)
      || left.id.localeCompare(right.id, "en");
  });
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  function selectColumn(key: SortKey) {
    setSort({ key, direction: "asc" });
  }
  function reverseColumn(key: SortKey) {
    setSort(current => ({
      key, direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  return <Table responsive aria-label="Invoices">
    <caption>Invoices in US dollars</caption>
    <thead><tr>
      {(["customer", "total"] as const).map(key => {
        const next = sort.key === key && sort.direction === "desc" ? "ascending" : "descending";
        const label = key === "customer" ? "Customer" : "Total";
        return <SortableTableHeader key={key} column={key} label={label}
          active={sort.key === key} direction={sort.direction}
          onSort={selectColumn} onDirection={reverseColumn}
          directionLabel={`Sort ${label.toLowerCase()} ${next}`}
          directionIcon={<span aria-hidden="true">{next === "ascending" ? "+" : "-"}</span>} />;
      })}
    </tr></thead>
    <tbody>
      {rows.map(invoice => <tr key={invoice.id}>
        <th scope="row">{invoice.customer}</th><td>{money.format(invoice.total)}</td>
      </tr>)}
      {rows.length === 0 ? <tr><td colSpan={2}>No invoices available.</td></tr> : null}
    </tbody>
  </Table>;
}
```

Provide stable unique IDs and finite numeric totals. Choose locale/currency in the application; for server-paginated data, send this sort state to the server instead of sorting only the current page.

## Add responsive filters

Save this as `DocumentFilters.tsx` and pass the current document records. Search and category selections are controlled by the application. Counts reflect the search result before the category selection, and selected zero-count options remain enabled so users can remove them. An empty selection means all categories; no reserved `"all"` option is needed.

```tsx
import "@wintermuted/ui-theme/index.css";
import { useState } from "react";
import { FacetFilter, FieldGroup, FilterPanel, Input } from "@wintermuted/ui-react";

type Category = "guide" | "reference";
type DocumentRecord = { id: string; title: string; category: Category };
const categories: readonly { value: Category; label: string }[] = [
  { value: "guide", label: "Guides" },
  { value: "reference", label: "References" },
];

export function DocumentFilters({ documents }: { documents: readonly DocumentRecord[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Category[]>([]);
  const searchResults = documents.filter(record =>
    record.title.toLowerCase().includes(query.trim().toLowerCase()));
  const options = categories.map(category => {
    const count = searchResults.filter(record => record.category === category.value).length;
    return { ...category, count, disabled: count === 0 && !selected.includes(category.value) };
  });
  const results = searchResults.filter(record =>
    selected.length === 0 || selected.includes(record.category));

  return <section aria-label="Document library">
    <FilterPanel
      labels={{ toggle: "Show filters", panel: "Document filters", title: "Filter documents",
        dismiss: "Dismiss filters", close: "Close filters" }}
      search={<FieldGroup label="Search documents">
        <Input type="search" value={query} onChange={event => setQuery(event.target.value)} />
      </FieldGroup>}
      summary={<p role="status">{results.length} documents found</p>}>
      <FacetFilter<Category> label="Category" options={options} selected={selected}
        onChange={setSelected} available={documents.length > 0} emptyLabel="No categories available."
        reset={{ label: "All categories", count: searchResults.length,
          selected: selected.length === 0, onSelect: () => setSelected([]) }}
        moreLabel="Show more categories" fewerLabel="Show fewer categories" />
    </FilterPanel>
    {results.length ? <ul>{results.map(record =>
      <li key={record.id}>{record.title}</li>)}</ul> : <p>No matching documents.</p>}
  </section>;
}
```

The aggregate stylesheet includes FilterPanel and facet styles. FilterPanel is inline above 48rem and a non-modal disclosure below it; controls stay mounted, so closing does not reset the application's filters. It supplies dismissal/focus-return behavior, not fetching, a focus trap, or scroll locking. Use `Dialog` if modality is required. Keep popup-containing controls out of clipping overflow containers.

## Initialize dark mode with SSR

This React 18/19 example renders a document on the server and hydrates only `#root`. It respects a saved light/dark preference or the operating system, rather than forcing dark mode for every visitor. The synchronous bootstrap runs before CSS to avoid a light first paint for dark-mode users.

Save the following modules alongside one another. The application chooses one storage key, uses it for bootstrap, client initialization and the provider, and waits until mount to render preference-dependent controls. The server and initial client tree both omit those controls, avoiding a hydration mismatch when local storage differs from the server's System default.

`theme-config.ts`:

```ts
export const storageKey = "document-app:theme";
```

`App.tsx`:

```tsx
import { useEffect, useState } from "react";
import { ThemeProvider, ThemeSelect } from "@wintermuted/ui-react";
import { storageKey } from "./theme-config";

export function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <main>
    <h1>Document library</h1>
    {mounted ? <ThemeProvider storageKey={storageKey}>
      <ThemeSelect label="Appearance" />
    </ThemeProvider> : null}
    <p>Theme styling is available before these controls mount.</p>
  </main>;
}
```

`server.tsx`:

```tsx
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { getThemeScript } from "@wintermuted/ui-react/theme";
import { App } from "./App";
import { storageKey } from "./theme-config";

export function renderDocument({ nonce, cssHref, clientSrc }: {
  nonce: string; cssHref: string; clientSrc: string;
}) {
  const appMarkup = renderToString(<App />);
  return "<!doctype html>" + renderToStaticMarkup(<html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Document library</title>
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: getThemeScript(storageKey) }} />
      <link rel="stylesheet" href={cssHref} />
    </head>
    <body>
      <div id="root" dangerouslySetInnerHTML={{ __html: appMarkup }} />
      <script type="module" nonce={nonce} src={clientSrc} />
    </body>
  </html>);
}
```

`client.tsx`:

```tsx
import "@wintermuted/ui-theme/index.css";
import { hydrateRoot } from "react-dom/client";
import { initTheme } from "@wintermuted/ui-react/theme";
import { App } from "./App";
import { storageKey } from "./theme-config";

initTheme({ storageKey });
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root.");
hydrateRoot(root, <App />);
```

The server route must supply `cssHref` and `clientSrc` from its bundler's asset manifest; `cssHref` points to the emitted theme CSS from the client import, not an npm package name or a guessed asset filename. Generate a fresh CSP nonce for each response and include it in the response's `script-src` policy. React escapes the nonce and asset attributes; `getThemeScript` escapes its serialized storage key. Do not insert untrusted HTML into either `dangerouslySetInnerHTML`.

Do not defer or make the bootstrap a module script. It changes only the document theme attributes, outside the hydrated root. For frameworks hydrating the document itself, use their supported head-script and hydration integration instead of copying this root-only server entry. Render other `useTheme`-dependent content inside the mounted provider, and keep a single document-level provider; do not suppress hydration warnings to hide divergent markup.
