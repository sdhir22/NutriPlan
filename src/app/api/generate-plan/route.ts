import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});
import { z } from "zod";
import {
  searchRecipes,
  getRecipesBulk,
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
  SpoonacularSearchResult,
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
      model: google("gemini-2.5-flash"),
      maxRetries: 0,
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

    // Progressive constraint relaxation: hard constraints (intolerances) are always kept;
    // soft constraints (cuisine, timing, macros) are dropped tier by tier if results are empty.
    async function searchWithRelaxation(
      mealType: "breakfast" | "lunch" | "dinner"
    ): Promise<SpoonacularSearchResult[]> {
      // Tier 1: all constraints
      let results = await searchRecipes(searchParams, mealType, 8);
      if (results.length > 0) return results;

      // Tier 2: keep diet + intolerances only (drop cuisine, timing, macros)
      const tier2: SpoonacularSearchParams = {
        constraintSummary: searchParams.constraintSummary,
        diet: parsed.diet,
        intolerances: parsed.intolerances,
      };
      results = await searchRecipes(tier2, mealType, 8);
      if (results.length > 0) return results;

      // Tier 3: intolerances only (safest hard constraint)
      if (parsed.intolerances) {
        const tier3: SpoonacularSearchParams = {
          constraintSummary: searchParams.constraintSummary,
          intolerances: parsed.intolerances,
        };
        results = await searchRecipes(tier3, mealType, 8);
      }
      return results;
    }

    // Step 2: Fetch recipe pools in parallel with constraint-preserving fallback
    const [breakfastPool, lunchPool, dinnerPool] = await Promise.all([
      searchWithRelaxation("breakfast"),
      searchWithRelaxation("lunch"),
      searchWithRelaxation("dinner"),
    ]);

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

    // Step 3: Assign recipes to 7 days deterministically (no LLM — avoids hallucinated IDs).
    // Spoonacular returns heavily overlapping results for lunch and dinner (both use
    // "main course"), so combine them into one deduplicated pool and split it in half —
    // first half goes to lunch, second half to dinner, guaranteeing no same-day duplicates.
    const seenMainCourse = new Set<number>();
    const mainCoursePool: typeof lunchPool = [];
    for (const r of [...lunchPool, ...dinnerPool]) {
      if (!seenMainCourse.has(r.id)) {
        seenMainCourse.add(r.id);
        mainCoursePool.push(r);
      }
    }
    const splitAt = Math.ceil(mainCoursePool.length / 2);
    const breakfastIds = new Set(breakfastPool.map((r) => r.id));
    const splitLunch = mainCoursePool.slice(0, splitAt).filter((r) => !breakfastIds.has(r.id));
    const splitDinner = mainCoursePool.slice(splitAt).filter((r) => !breakfastIds.has(r.id));

    const validBreakfast = breakfastPool.filter((r) => recipeMap.has(r.id));
    const validLunch = splitLunch.filter((r) => recipeMap.has(r.id));
    const validDinner = splitDinner.filter((r) => recipeMap.has(r.id));

    // If a split half is empty, borrow from the other half with a half-pool offset so
    // same-day lunch and dinner are never the same recipe.
    const lFallback = validLunch.length > 0 ? validLunch : validBreakfast;
    const rawDFallback = validDinner.length > 0 ? validDinner : (validLunch.length > 0 ? validLunch : validBreakfast);
    const dOffset = rawDFallback === lFallback ? Math.ceil(rawDFallback.length / 2) : 0;
    const bFallback = validBreakfast.length > 0 ? validBreakfast : lFallback;

    const days: DayPlan[] = DAY_LABELS.map((dayLabel, i) => ({
      day: i + 1,
      dayLabel,
      breakfast: recipeMap.get(bFallback[i % bFallback.length].id)!,
      lunch: recipeMap.get(lFallback[i % lFallback.length].id)!,
      dinner: recipeMap.get(rawDFallback[(i + dOffset) % rawDFallback.length].id)!,
    }));

    const mealPlan: MealPlan = {
      days,
      constraintSummary: parsed.constraintSummary,
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

    // Gemini rate limit / overload — AI SDK wraps as AI_APICallError with statusCode 429 or 503
    const statusCode =
      typeof err === "object" && err !== null && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : null;
    const isTransient =
      statusCode === 429 ||
      statusCode === 503 ||
      (err instanceof Error &&
        (err.message.includes("429") ||
          err.message.toLowerCase().includes("high demand") ||
          err.message.toLowerCase().includes("overloaded")));
    if (isTransient) {
      console.error("[generate-plan] transient AI error:", err);
      return Response.json(
        { error: "AI service is busy. Please wait a moment and try again.", code: "AI_RATE_LIMIT" },
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
