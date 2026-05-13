import type { Recipe, SpoonacularSearchParams, SpoonacularSearchResult } from "./types";

const BASE = "https://api.spoonacular.com";

class SpoonacularError extends Error {
  constructor(
    message: string,
    public code: "QUOTA_EXCEEDED" | "UNAUTHORIZED" | "NO_RECIPES" | "API_ERROR"
  ) {
    super(message);
    this.name = "SpoonacularError";
  }
}

async function spoonacularFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (res.status === 402) {
    throw new SpoonacularError(
      "Spoonacular daily quota exceeded. Try again tomorrow.",
      "QUOTA_EXCEEDED"
    );
  }
  if (res.status === 401) {
    throw new SpoonacularError("Invalid Spoonacular API key.", "UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new SpoonacularError(
      `Spoonacular API error: ${res.status}`,
      "API_ERROR"
    );
  }

  return res.json() as Promise<T>;
}

export async function searchRecipes(
  params: SpoonacularSearchParams,
  mealType: "breakfast" | "lunch" | "dinner",
  count = 8
): Promise<SpoonacularSearchResult[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const typeMap = {
    breakfast: "breakfast",
    lunch: "main course,salad,soup",
    dinner: "main course",
  };

  const qs = new URLSearchParams({ apiKey, number: String(count) });
  qs.set("type", typeMap[mealType]);

  if (params.diet) qs.set("diet", params.diet);
  if (params.intolerances) qs.set("intolerances", params.intolerances);
  if (params.cuisine) qs.set("cuisine", params.cuisine);
  if (params.excludeCuisine) qs.set("excludeCuisine", params.excludeCuisine);
  if (params.maxReadyTime != null) qs.set("maxReadyTime", String(params.maxReadyTime));
  if (params.minCalories != null) qs.set("minCalories", String(params.minCalories));
  if (params.maxCalories != null) qs.set("maxCalories", String(params.maxCalories));
  if (params.minProtein != null) qs.set("minProtein", String(params.minProtein));
  if (params.maxProtein != null) qs.set("maxProtein", String(params.maxProtein));
  if (params.maxCarbs != null) qs.set("maxCarbs", String(params.maxCarbs));
  if (params.maxFat != null) qs.set("maxFat", String(params.maxFat));
  if (params.query) qs.set("query", params.query);

  const data = await spoonacularFetch<{ results: SpoonacularSearchResult[] }>(
    `${BASE}/recipes/complexSearch?${qs}`
  );

  return data.results ?? [];
}

export async function getRecipesBulk(ids: number[]): Promise<Recipe[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const qs = new URLSearchParams({
    apiKey,
    ids: ids.join(","),
    includeNutrition: "true",
  });

  const data = await spoonacularFetch<Recipe[]>(
    `${BASE}/recipes/informationBulk?${qs}`
  );

  return data;
}

export async function getRandomRecipes(
  tags: string[],
  count = 8
): Promise<Recipe[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const qs = new URLSearchParams({
    apiKey,
    number: String(count),
    "include-tags": tags.join(","),
    includeNutrition: "true",
  });

  const data = await spoonacularFetch<{ recipes: Recipe[] }>(
    `${BASE}/recipes/random?${qs}`
  );

  return data.recipes ?? [];
}

export { SpoonacularError };
