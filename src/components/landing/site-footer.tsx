import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center text-sm text-muted sm:flex-row sm:text-left">
        <div>
          <p className="font-display font-semibold text-foreground">NutriPlan</p>
          <p className="mt-1">Meal intelligence for real kitchens.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a
            href="https://spoonacular.com/food-api"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Spoonacular API
          </a>
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Deployed on Vercel
          </a>
        </div>
      </div>
    </footer>
  );
}
