import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import {
  searchRecipes,
  getRecipesBulk,
  getRandomRecipes,
  SpoonacularError,
} from "@/lib/spoonacular";
import type {
  DayPlan,
  GroceryCategory,
  GroceryItem,
  MealPlan,
  GroceryList,
  GeneratePlanResponse,
  Recipe,
  SpoonacularSearchParams,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const constraintParamsSchema = z.object({
  diet: z
    .enum([
      "vegetarian",
      "vegan",
      "gluten free",
      "ketogenic",
      "paleo",
      "primal",
      "low fodmap",
      "whole30",
    ])
    .optional(),
  intolerances: z.string().optional(),
  cuisine: z.string().optional(),
  excludeCuisine: z.string().optional(),
  maxReadyTime: z.number().int().min(5).max(180).optional(),
  minCalories: z.number().optional(),
  maxCalories: z.number().optional(),
  minProtein: z.number().optional(),
  maxProtein: z.number().optional(),
  maxCarbs: z.number().optional(),
  maxFat: z.number().optional(),
  query: z.string().optional(),
  constraintSummary: z.string(),
});

const mealPlanAssignmentSchema = z.object({
  days: z
    .array(
      z.object({
        day: z.number().int().min(1).max(7),
        dayLabel: z.enum(DAY_LABELS),
        breakfastId: z.number().int(),
        lunchId: z.number().int(),
        dinnerId: z.number().int(),
      })
    )
    .length(7),
  constraintSummary: z.string(),
});

function buildGroceryList(recipes: Recipe[]): GroceryList {
  const categoryMap = new Map<string, Map<string, GroceryItem>>();

  for (const recipe of recipes) {
    for (const ing of recipe.extendedIngredients ?? []) {
      const category = ing.aisle?.trim() || "Other";
      const key = ing.name.toLowerCase().trim() + "|" + ing.unit.toLowerCase().trim();

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }
      const catItems = categoryMap.get(category)!;

      if (catItems.has(key)) {
        const existing = catItems.get(key)!;
        existing.amount += ing.amount;
      } else {
        catItems.set(key, {
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          original: ing.original,
          aisle: category,
        });
      }
    }
  }

  const categories: GroceryCategory[] = Array.from(categoryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, itemMap]) => ({
      category,
      items: Array.from(itemMap.values()),
    }));

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return { categories, totalItems };
}

export async function POST(request: Request) {
  let body: { constraints?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body.", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const constraints = body.constraints;
  if (typeof constraints !== "string" || constraints.trim().length < 5) {
    return Response.json(
      { error: "Please describe your dietary needs (at least 5 characters).", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }
  if (constraints.length > 1000) {
    return Response.json(
      { error: "Description too long (max 1000 characters).", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Gemini parses constraints into Spoonacular params
    const { object: parsed } = await generateObject({
      model: google("gemini-2.5-flash-preview-04-17"),
      schema: constraintParamsSchema,
      prompt: `Parse these dietary constraints into Spoonacular API parameters.

Constraints: "${constraints.trim()}"

Rules:
- diet: only use exact Spoonacular diet types (vegetarian, vegan, gluten free, ketogenic, paleo, primal, low fodmap, whole30)
- intolerances: comma-separated from: dairy, egg, gluten, peanut, seafood, sesame, shellfish, soy, tree nut, wheat
- cuisine: comma-separated Spoonacular cuisine names (e.g. "italian,mediterranean,asian")
- "high protein" → minProtein: 30
- "low carb" or "keto" → maxCarbs: 20
- "no dairy" → intolerances includes "dairy"
- "quick" or "under 30 min" → maxReadyTime: 30
- "kid-friendly" or "family" → query: "kid-friendly"
- constraintSummary: 1-2 sentences summarising what you understood in plain English`,
    });

    const searchParams: SpoonacularSearchParams = { ...parsed };

    // Step 2: Fetch recipe pools in parallel (breakfast / lunch / dinner)
    let [breakfastPool, lunchPool, dinnerPool] = await Promise.all([
      searchRecipes(searchParams, "breakfast", 8),
      searchRecipes(searchParams, "lunch", 8),
      searchRecipes(searchParams, "dinner", 8),
    ]);

    // Fallback to random if any pool is empty
    if (breakfastPool.length === 0) {
      const tags = ["breakfast", parsed.diet].filter(Boolean) as string[];
      const fallback = await getRandomRecipes(tags, 8);
      breakfastPool = fallback.map((r) => ({ id: r.id, title: r.title, image: r.image, imageType: r.imageType }));
    }
    if (lunchPool.length === 0) {
      const tags = ["lunch", parsed.diet].filter(Boolean) as string[];
      const fallback = await getRandomRecipes(tags, 8);
      lunchPool = fallback.map((r) => ({ id: r.id, title: r.title, image: r.image, imageType: r.imageType }));
    }
    if (dinnerPool.length === 0) {
      const tags = ["dinner", parsed.diet].filter(Boolean) as string[];
      const fallback = await getRandomRecipes(tags, 8);
      dinnerPool = fallback.map((r) => ({ id: r.id, title: r.title, image: r.image, imageType: r.imageType }));
    }

    if (breakfastPool.length === 0 && lunchPool.length === 0 && dinnerPool.length === 0) {
      return Response.json(
        {
          error: "No recipes found matching your constraints. Try broadening your requirements.",
          code: "NO_RECIPES",
        },
        { status: 404 }
      );
    }

    // Bulk fetch full recipe details for all unique IDs
    const allIds = [
      ...new Set([...breakfastPool, ...lunchPool, ...dinnerPool].map((r) => r.id)),
    ];
    const allRecipes = await getRecipesBulk(allIds);
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));

    // Step 3: Gemini assigns recipes to 7 days
    const { object: assignment } = await generateObject({
      model: google("gemini-2.5-flash-preview-04-17"),
      schema: mealPlanAssignmentSchema,
      prompt: `Create a 7-day meal plan using ONLY the recipe IDs listed below.

Available breakfast recipes: ${JSON.stringify(breakfastPool.map((r) => ({ id: r.id, title: r.title })))}
Available lunch recipes: ${JSON.stringify(lunchPool.map((r) => ({ id: r.id, title: r.title })))}
Available dinner recipes: ${JSON.stringify(dinnerPool.map((r) => ({ id: r.id, title: r.title })))}

User constraints: "${constraints.trim()}"

Rules:
- Assign days 1 (Monday) through 7 (Sunday)
- Use ONLY IDs from the breakfast list for breakfastId, lunch list for lunchId, dinner list for dinnerId
- Vary meals — avoid repeating the same recipe on back-to-back days where possible
- It is OK to repeat if the pool is small
- constraintSummary: one sentence on what the plan achieves`,
    });

    // Resolve recipe IDs → full Recipe objects, substituting if Gemini hallucinated an ID
    const getRecipeOrFallback = (id: number, pool: typeof breakfastPool): Recipe => {
      if (recipeMap.has(id)) return recipeMap.get(id)!;
      const fallbackId = pool.find((r) => recipeMap.has(r.id))?.id;
      if (fallbackId) return recipeMap.get(fallbackId)!;
      return allRecipes[0];
    };

    const days: DayPlan[] = assignment.days.map((d) => ({
      day: d.day,
      dayLabel: d.dayLabel,
      breakfast: getRecipeOrFallback(d.breakfastId, breakfastPool),
      lunch: getRecipeOrFallback(d.lunchId, lunchPool),
      dinner: getRecipeOrFallback(d.dinnerId, dinnerPool),
    }));

    const mealPlan: MealPlan = {
      days,
      constraintSummary: assignment.constraintSummary,
      generatedAt: new Date().toISOString(),
    };

    // Build grocery list from all assigned recipes (server-side, deterministic)
    const assignedRecipes = days.flatMap((d) => [d.breakfast, d.lunch, d.dinner]);
    const groceryList = buildGroceryList(assignedRecipes);

    const response: GeneratePlanResponse = { mealPlan, groceryList };
    return Response.json(response);
  } catch (err) {
    if (err instanceof SpoonacularError) {
      const status = err.code === "QUOTA_EXCEEDED" ? 402 : 500;
      return Response.json({ error: err.message, code: err.code }, { status });
    }

    // Gemini rate limit
    if (err instanceof Error && err.message.includes("429")) {
      return Response.json(
        { error: "AI service is busy. Please try again in a moment.", code: "AI_RATE_LIMIT" },
        { status: 429 }
      );
    }

    console.error("[generate-plan]", err);
    return Response.json(
      { error: "Something went wrong. Please try again.", code: "UNKNOWN" },
      { status: 500 }
    );
  }
}
