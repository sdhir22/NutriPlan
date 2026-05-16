"use client";

import { useState } from "react";
import type { GeneratePlanResponse } from "@/lib/types";
import { MealPlanGrid } from "./meal-plan-grid";
import { GroceryList } from "./grocery-list";
import { PlanSkeleton } from "./plan-skeleton";

type PlanState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: GeneratePlanResponse }
  | { status: "error"; message: string };

const BREAKFAST_EXAMPLES = [
  "Quick, high protein, no dairy",
  "Vegan, under 400 calories, sweet options",
  "Keto-friendly, egg-based, under 15 min",
];

const LUNCH_EXAMPLES = [
  "Light, Mediterranean, under 500 calories",
  "High fiber, vegetarian, salads and soups",
  "Kid-friendly, gluten-free, quick assembly",
];

const DINNER_EXAMPLES = [
  "High protein, no seafood, Italian cuisine",
  "Family-style, one-pot, hearty and warm",
  "Vegan, Asian cuisine, under 600 calories",
];

const MEAL_SLOTS = [
  {
    key: "breakfast" as const,
    label: "Breakfast",
    placeholder: "e.g. quick, high protein, no dairy, egg-based",
    examples: BREAKFAST_EXAMPLES,
  },
  {
    key: "lunch" as const,
    label: "Lunch",
    placeholder: "e.g. light, Mediterranean, salads and soups, under 500 cal",
    examples: LUNCH_EXAMPLES,
  },
  {
    key: "dinner" as const,
    label: "Dinner",
    placeholder: "e.g. high protein, Italian cuisine, no seafood, family-style",
    examples: DINNER_EXAMPLES,
  },
] as const;

type MealKey = "breakfast" | "lunch" | "dinner";

export function ConstraintForm() {
  const [values, setValues] = useState<Record<MealKey, string>>({
    breakfast: "",
    lunch: "",
    dinner: "",
  });
  const [state, setState] = useState<PlanState>({ status: "idle" });

  function setValue(key: MealKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const allFilled = Object.values(values).every((v) => v.trim().length >= 5);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled) return;

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          breakfastConstraints: values.breakfast,
          lunchConstraints: values.lunch,
          dinnerConstraints: values.dinner,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Something went wrong." });
        return;
      }

      setState({ status: "success", data });
    } catch {
      setState({ status: "error", message: "Network error. Please check your connection and try again." });
    }
  }

  function handleReset() {
    setState({ status: "idle" });
  }

  const isLoading = state.status === "loading";

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {MEAL_SLOTS.map(({ key, label, placeholder, examples }) => {
          const value = values[key];
          const isEmpty = value.length === 0 && state.status === "idle";

          return (
            <div key={key} className="space-y-2">
              <label
                htmlFor={`constraint-${key}`}
                className="block text-sm font-semibold text-foreground"
              >
                {label}
              </label>
              <textarea
                id={`constraint-${key}`}
                value={value}
                onChange={(e) => setValue(key, e.target.value)}
                placeholder={placeholder}
                rows={3}
                maxLength={1000}
                disabled={isLoading}
                className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{value.length}/1000</p>
              </div>

              {isEmpty && (
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setValue(key, example)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !allFilled}
            className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Generating…" : "Generate Meal Plan"}
          </button>

          {state.status === "success" && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
            >
              Start over
            </button>
          )}
        </div>
      </form>

      {state.status === "loading" && <PlanSkeleton />}

      {state.status === "error" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {state.message}
          </p>
          <button
            onClick={handleReset}
            className="mt-3 text-xs font-medium text-red-600 underline hover:no-underline dark:text-red-400"
          >
            Try again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <div className="mt-2">
          <MealPlanGrid mealPlan={state.data.mealPlan} />
          <GroceryList groceryList={state.data.groceryList} />
        </div>
      )}
    </div>
  );
}
