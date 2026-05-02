const items = [
  {
    title: "Talk like a human",
    body: "No rigid forms. Say things like “high protein, no dairy, kid-friendly dinners” and the LLM interprets your intent before planning.",
    icon: ChatIcon,
  },
  {
    title: "Real recipes, real data",
    body: "Meals are grounded in Spoonacular’s recipe and nutrition database so portions, ingredients, and tags stay consistent.",
    icon: LeafIcon,
  },
  {
    title: "Week view + grocery list",
    body: "Get a clear day-by-day plan and one consolidated shopping list with deduplicated ingredients where it makes sense.",
    icon: CartIcon,
  },
  {
    title: "Built for the web",
    body: "Next.js on Vercel—fast loads, easy sharing, and a path to accounts and saved plans when you are ready.",
    icon: BoltIcon,
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="border-t border-border bg-card/50 px-4 py-20 sm:px-6"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2
            id="features-heading"
            className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Everything in one flow
          </h2>
          <p className="mt-4 text-lg text-muted">
            From a messy paragraph of dietary needs to a plan you can cook from
            and shop for—without bouncing between tabs and spreadsheets.
          </p>
        </div>
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {items.map((item) => {
            const Icon = item.icon;
            return (
            <li
              key={item.title}
              className="flex gap-4 rounded-2xl border border-border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent dark:bg-accent/25"
                aria-hidden
              >
                <Icon />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22c4-3 8-7 8-12a8 8 0 10-16 0c0 5 4 9 8 12z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 22V12M12 12c-2-2-2-6 0-8s6-2 8 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6h15l-1.5 9h-12L4.5 4H2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1" fill="currentColor" />
      <circle cx="18" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
