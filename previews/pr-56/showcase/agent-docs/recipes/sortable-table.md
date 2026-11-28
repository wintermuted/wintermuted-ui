# Create a sortable table

Install `@wintermuted/ui-react`, `@wintermuted/ui-theme`, React and React DOM. Check your installed exports and declarations before using these source-revision examples.

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

## References

- [Installation and package selection](../installation.md)
- [All task-oriented recipes](../recipes.md)
- [React component contracts](../react.md)
- [CSS imports and dependencies](../theme.md)
- [Theme preferences and SSR](../theming.md)
