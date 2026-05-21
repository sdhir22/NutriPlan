import type { GroceryItem, GroceryList, GroceryQuantity } from "@/lib/types";

function formatAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
}

function formatQuantity(q: GroceryQuantity): string {
  return `${formatAmount(q.amount)} ${q.unit}`.trim();
}

function formatGroceryLine(item: GroceryItem): string {
  const qtys = item.quantities
    .filter((q) => q.amount > 0)
    .map(formatQuantity)
    .join(" + ");
  const base = qtys ? `${qtys} ${item.name}` : item.name;
  return item.toTaste ? `${base} (to taste)` : base;
}

export function GroceryList({ groceryList }: { groceryList: GroceryList }) {
  return (
    <section aria-label="Grocery list" className="mt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Grocery List{" "}
        <span className="text-lg font-normal text-muted">
          ({groceryList.totalItems} items)
        </span>
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groceryList.categories.map((cat) => (
          <div
            key={cat.category}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="mb-3 font-semibold text-foreground">{cat.category}</h3>
            <ul className="space-y-2">
              {cat.items.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5 text-sm text-muted">
                  <span
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border bg-background"
                    aria-hidden
                  />
                  {formatGroceryLine(item)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
