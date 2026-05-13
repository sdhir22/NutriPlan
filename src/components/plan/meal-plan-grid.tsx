import type { MealPlan } from "@/lib/types";
import { RecipeCard } from "./recipe-card";

export function MealPlanGrid({ mealPlan }: { mealPlan: MealPlan }) {
  return (
    <section aria-label="7-day meal plan" className="mt-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Your Week
      </h2>
      {mealPlan.constraintSummary && (
        <p className="mt-2 text-sm text-muted">{mealPlan.constraintSummary}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <div className="min-w-[756px] p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {mealPlan.days.map((day) => (
              <div
                key={day.day}
                className="text-center text-xs font-semibold uppercase tracking-wider text-muted"
              >
                {day.dayLabel.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Breakfast row */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {mealPlan.days.map((day) => (
              <RecipeCard key={`${day.day}-breakfast`} recipe={day.breakfast} slot="breakfast" />
            ))}
          </div>

          {/* Lunch row */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {mealPlan.days.map((day) => (
              <RecipeCard key={`${day.day}-lunch`} recipe={day.lunch} slot="lunch" />
            ))}
          </div>

          {/* Dinner row */}
          <div className="grid grid-cols-7 gap-3">
            {mealPlan.days.map((day) => (
              <RecipeCard key={`${day.day}-dinner`} recipe={day.dinner} slot="dinner" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
