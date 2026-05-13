import Link from "next/link";

export function CtaSection() {
  return (
    <section
      id="get-started"
      className="border-t border-border px-4 py-20 sm:px-6"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-accent px-8 py-14 text-center shadow-lg sm:px-12 dark:shadow-none">
        <h2
          id="cta-heading"
          className="font-display text-2xl font-semibold tracking-tight text-background sm:text-3xl"
        >
          Early access is opening soon
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-background/90 sm:text-base">
          We are finishing the planner, list builder, and guardrails around dietary
          data. Leave your email when the form goes live, or watch the repo for
          updates.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/plan"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-full border border-background/30 bg-background/10 px-6 text-sm font-medium text-background backdrop-blur-sm transition-opacity hover:opacity-90"
          >
            Try the planner now
          </Link>
          <a
            href="https://github.com/sdhir22/NutriPlan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-background px-6 text-sm font-semibold text-accent transition-opacity hover:opacity-95"
          >
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
