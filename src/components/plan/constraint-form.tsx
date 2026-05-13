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

const EXAMPLES = [
  "High protein, no dairy, Mediterranean dinners",
  "Vegetarian, under 500 calories per meal, quick breakfasts",
  "Vegan, gluten-free, kid-friendly family meals",
  "Keto, no seafood, Italian cuisine",
];

export function ConstraintForm() {
  const [constraints, setConstraints] = useState("");
  const [state, setState] = useState<PlanState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (constraints.trim().length < 5) return;

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ constraints }),
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
  const charCount = constraints.length;

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="constraints"
            className="block text-sm font-medium text-foreground"
          >
            Describe your dietary needs
          </label>
          <textarea
            id="constraints"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="e.g. high protein, no dairy, kid-friendly dinners, Mediterranean cuisine, under 600 calories per meal"
            rows={4}
            maxLength={1000}
            disabled={isLoading}
            className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">{charCount}/1000 characters</p>
          </div>
        </div>

        {/* Example prompts */}
        {state.status === "idle" && constraints.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setConstraints(example)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || constraints.trim().length < 5}
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
