import type { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  slot: "breakfast" | "lunch" | "dinner";
}

function getCalories(recipe: Recipe): number | null {
  const cal = recipe.nutrition?.nutrients.find(
    (n) => n.name.toLowerCase() === "calories"
  );
  return cal ? Math.round(cal.amount) : null;
}

function getMacro(recipe: Recipe, name: string): number | null {
  const n = recipe.nutrition?.nutrients.find(
    (n) => n.name.toLowerCase() === name.toLowerCase()
  );
  return n ? Math.round(n.amount) : null;
}

export function RecipeCard({ recipe, slot }: RecipeCardProps) {
  const calories = getCalories(recipe);
  const protein = getMacro(recipe, "protein");
  const carbs = getMacro(recipe, "carbohydrates");
  const fat = getMacro(recipe, "fat");

  return (
    <article className="flex flex-col rounded-xl border border-border bg-background p-3 shadow-sm">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent">
        {slot}
      </p>
      <img
        src={recipe.image}
        alt={recipe.title}
        className="mb-2 w-full rounded-lg object-cover"
        style={{ aspectRatio: "312/231" }}
        loading="lazy"
        width={312}
        height={231}
      />
      <h3 className="line-clamp-2 flex-1 text-xs font-semibold leading-snug text-foreground">
        {recipe.title}
      </h3>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
        <span>{recipe.readyInMinutes} min</span>
        <span aria-hidden>·</span>
        <span>{recipe.servings} srv</span>
        {calories != null && (
          <>
            <span aria-hidden>·</span>
            <span>{calories} cal</span>
          </>
        )}
      </div>
      {(protein != null || carbs != null || fat != null) && (
        <div className="mt-1.5 flex gap-3 text-[11px] text-muted">
          {protein != null && (
            <span><span className="font-semibold text-foreground">P</span> {protein}g</span>
          )}
          {carbs != null && (
            <span><span className="font-semibold text-foreground">C</span> {carbs}g</span>
          )}
          {fat != null && (
            <span><span className="font-semibold text-foreground">F</span> {fat}g</span>
          )}
        </div>
      )}
      <a
        href={recipe.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 text-[11px] font-medium text-accent hover:underline"
      >
        View recipe →
      </a>
    </article>
  );
}
