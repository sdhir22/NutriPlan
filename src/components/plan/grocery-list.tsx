import type { GroceryList } from "@/lib/types";

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
              {cat.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                  <span
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border bg-background"
                    aria-hidden
                  />
                  {item.original}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
