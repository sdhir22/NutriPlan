import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-foreground"
        >
          NutriPlan
        </Link>
        <nav
          className="flex flex-wrap items-center justify-end gap-3 text-sm font-medium text-muted sm:gap-6"
          aria-label="Primary"
        >
          <a href="#features" className="hidden transition-colors hover:text-foreground sm:inline">
            Features
          </a>
          <a
            href="#how-it-works"
            className="hidden transition-colors hover:text-foreground sm:inline"
          >
            How it works
          </a>
          <a
            href="#get-started"
            className="rounded-full bg-accent px-4 py-2 text-sm text-background transition-colors hover:bg-accent-hover"
          >
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}
