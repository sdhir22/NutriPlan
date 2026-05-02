export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-highlight/25 blur-3xl dark:bg-highlight/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-accent/15 blur-3xl dark:bg-accent/20"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
          Spoonacular + LLM
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
          Meal plans and grocery lists that actually fit how you eat.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Describe allergies, macros, cuisines, or family preferences in natural
          language. NutriPlan turns that into a structured week of meals and a
          ready-to-shop list.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href="#get-started"
            className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-accent-hover"
          >
            Join the waitlist
          </a>
          <a
            href="#how-it-works"
            className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-full border border-border bg-card px-8 text-sm font-semibold text-foreground transition-colors hover:border-accent/40"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
