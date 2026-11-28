# Add responsive filters

Install `@wintermuted/ui-react`, `@wintermuted/ui-theme`, React and React DOM. Check your installed exports and declarations before using these source-revision examples.

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

## References

- [Installation and package selection](../installation.md)
- [All task-oriented recipes](../recipes.md)
- [React component contracts](../react.md)
- [CSS imports and dependencies](../theme.md)
- [Theme preferences and SSR](../theming.md)
