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

type ParsedConstraints = z.infer<typeof constraintParamsSchema>;

function buildParsePrompt(mealType: string, constraints: string): string {
  return `Parse these dietary constraints for ${mealType} into Spoonacular API parameters.

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
- constraintSummary: 1-2 sentences summarising what you understood in plain English`;
}

function buildGroceryList(recipes: Recipe[]): GroceryList {
  // First pass: group by Spoonacular ingredient id (canonical identifier).
  // Within each id, sub-aggregate amounts by normalized unit. Track aisle
  // and best display name from the first occurrence.
  const itemsById = new Map<number, GroceryItem>();
  const unitTotals = new Map<number, Map<string, number>>();

  for (const recipe of recipes) {
    for (const ing of recipe.extendedIngredients ?? []) {
      const aisle = ing.aisle?.trim() || "Other";
      const rawUnit = ing.unit?.trim() ?? "";
      const normalizedUnit = rawUnit.toLowerCase();
      const isToTaste = normalizedUnit === "servings";
      const displayName = ing.nameClean?.trim() || ing.name.trim();

      let item = itemsById.get(ing.id);
      if (!item) {
        item = {
          id: ing.id,
          name: displayName,
          quantities: [],
          toTaste: false,
          aisle,
        };
        itemsById.set(ing.id, item);
        unitTotals.set(ing.id, new Map());
      }

      if (isToTaste) {
        item.toTaste = true;
        continue;
      }

      const totals = unitTotals.get(ing.id)!;
      // Preserve the first-seen casing for display by keying on lowercase
      // but storing the original-cased unit on the quantity record.
      const existing = totals.get(normalizedUnit);
      if (existing != null) {
        totals.set(normalizedUnit, existing + ing.amount);
      } else {
        totals.set(normalizedUnit, ing.amount);
        item.quantities.push({ amount: ing.amount, unit: rawUnit });
      }
    }
  }

  // Reconcile summed amounts back onto each item's quantities array.
  for (const [id, item] of itemsById) {
    const totals = unitTotals.get(id)!;
    item.quantities = item.quantities.map((q) => ({
      amount: totals.get(q.unit.toLowerCase()) ?? q.amount,
      unit: q.unit,
    }));
  }

  // Bucket items by aisle, then sort.
  const categoryMap = new Map<string, GroceryItem[]>();
  for (const item of itemsById.values()) {
    if (!categoryMap.has(item.aisle)) categoryMap.set(item.aisle, []);
    categoryMap.get(item.aisle)!.push(item);
  }

  const categories: GroceryCategory[] = Array.from(categoryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }));

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return { categories, totalItems };
}

function validateConstraint(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string" || value.trim().length < 5) {
    return `"${fieldName}" must be at least 5 characters.`;
  }
  if (value.length > 1000) {
    return `"${fieldName}" must be 1000 characters or fewer.`;
  }
  return null;
}

async function searchWithRelaxation(
  mealType: "breakfast" | "lunch" | "dinner",
  params: SpoonacularSearchParams,
  parsed: ParsedConstraints
): Promise<SpoonacularSearchResult[]> {
  // Tier 1: all constraints
  let results = await searchRecipes(params, mealType, 8);
  if (results.length > 0) return results;

  // Tier 2: keep diet + intolerances only (drop cuisine, timing, macros)
  const tier2: SpoonacularSearchParams = {
    constraintSummary: params.constraintSummary,
    diet: parsed.diet,
    intolerances: parsed.intolerances,
  };
  results = await searchRecipes(tier2, mealType, 8);
  if (results.length > 0) return results;

  // Tier 3: intolerances only (safest hard constraint)
  if (parsed.intolerances) {
    const tier3: SpoonacularSearchParams = {
      constraintSummary: params.constraintSummary,
      intolerances: parsed.intolerances,
    };
    results = await searchRecipes(tier3, mealType, 8);
  }
  return results;
}

export async function POST(request: Request) {
  let body: { breakfastConstraints?: unknown; lunchConstraints?: unknown; dinnerConstraints?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body.", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const bError = validateConstraint(body.breakfastConstraints, "breakfastConstraints");
  const lError = validateConstraint(body.lunchConstraints, "lunchConstraints");
  const dError = validateConstraint(body.dinnerConstraints, "dinnerConstraints");
  const validationError = bError ?? lError ?? dError;
  if (validationError) {
    return Response.json({ error: validationError, code: "INVALID_INPUT" }, { status: 400 });
  }

  const breakfastConstraints = (body.breakfastConstraints as string).trim();
  const lunchConstraints = (body.lunchConstraints as string).trim();
  const dinnerConstraints = (body.dinnerConstraints as string).trim();

  try {
    // Step 1: Parse all three constraint sets in parallel with Gemini
    const [{ object: bParsed }, { object: lParsed }, { object: dParsed }] = await Promise.all([
      generateObject({
        model: google("gemini-2.5-flash"),
        maxRetries: 2,
        schema: constraintParamsSchema,
        prompt: buildParsePrompt("breakfast", breakfastConstraints),
      }),
      generateObject({
        model: google("gemini-2.5-flash"),
        maxRetries: 2,
        schema: constraintParamsSchema,
        prompt: buildParsePrompt("lunch", lunchConstraints),
      }),
      generateObject({
        model: google("gemini-2.5-flash"),
        maxRetries: 2,
        schema: constraintParamsSchema,
        prompt: buildParsePrompt("dinner", dinnerConstraints),
      }),
    ]);

    // Step 2: Fetch recipe pools in parallel, each with its own parsed params
    const [breakfastPool, lunchPool, dinnerPool] = await Promise.all([
      searchWithRelaxation("breakfast", { ...bParsed }, bParsed),
      searchWithRelaxation("lunch", { ...lParsed }, lParsed),
      searchWithRelaxation("dinner", { ...dParsed }, dParsed),
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

    // Step 3: Assign recipes to 7 days deterministically.
    // Combine lunch + dinner pools (both use "main course") into one deduplicated pool,
    // split in half — first half to lunch, second half to dinner — to prevent same-day duplicates.
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
      breakfastSummary: bParsed.constraintSummary,
      lunchSummary: lParsed.constraintSummary,
      dinnerSummary: dParsed.constraintSummary,
      generatedAt: new Date().toISOString(),
    };

    const assignedRecipes = days.flatMap((d) => [d.breakfast, d.lunch, d.dinner]);
    const groceryList = buildGroceryList(assignedRecipes);

    const response: GeneratePlanResponse = { mealPlan, groceryList };
    return Response.json(response);
  } catch (err) {
    if (err instanceof SpoonacularError) {
      const status = err.code === "QUOTA_EXCEEDED" ? 402 : 500;
      return Response.json({ error: err.message, code: err.code }, { status });
    }

    const statusCode =
      typeof err === "object" && err !== null && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : null;
    const isRetryable =
      typeof err === "object" && err !== null && "isRetryable" in err
        ? (err as { isRetryable: boolean }).isRetryable === true
        : false;
    const causeCode =
      typeof err === "object" && err !== null && "cause" in err && err.cause
        ? (err.cause as { code?: string }).code
        : undefined;
    const isConnectError =
      causeCode === "UND_ERR_CONNECT_TIMEOUT" ||
      causeCode === "UND_ERR_SOCKET" ||
      causeCode === "ECONNRESET" ||
      causeCode === "ETIMEDOUT" ||
      causeCode === "ENOTFOUND" ||
      (err instanceof Error &&
        (err.message.toLowerCase().includes("connect timeout") ||
          err.message.toLowerCase().includes("cannot connect")));
    const isTransient =
      statusCode === 429 ||
      statusCode === 503 ||
      isRetryable ||
      isConnectError ||
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
