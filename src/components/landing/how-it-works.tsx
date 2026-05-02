const steps = [
  {
    step: "01",
    title: "Describe your constraints",
    body: "Allergies, calories, cuisines, budget, or “something everyone will eat on Tuesday.”",
  },
  {
    step: "02",
    title: "NutriPlan drafts your week",
    body: "The LLM structures your ask; Spoonacular backs it with recipes and ingredient lines you can trust.",
  },
  {
    step: "03",
    title: "Cook and shop with confidence",
    body: "Open your plan, tweak meals if needed, and take the grocery list to the store or your delivery app.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-4 py-20 sm:px-6"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="how-heading"
          className="font-display text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          How it works
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted">
          Three steps from “here is how we eat” to a plan on your fridge.
        </p>
        <ol className="mt-16 grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((s) => (
            <li
              key={s.step}
              className="relative rounded-2xl border border-border bg-card p-8 pt-10"
            >
              <span className="absolute left-8 top-0 -translate-y-1/2 rounded-full bg-highlight px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                {s.step}
              </span>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
