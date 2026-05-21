export interface SpoonacularIngredient {
  id: number;
  name: string;
  nameClean?: string;
  original: string;
  amount: number;
  unit: string;
  aisle: string;
}

export interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface SpoonacularNutrition {
  nutrients: SpoonacularNutrient[];
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  extendedIngredients: SpoonacularIngredient[];
  nutrition?: SpoonacularNutrition;
}

export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
  imageType: string;
}

export interface DayPlan {
  day: number;
  dayLabel: string;
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
}

export interface MealPlan {
  days: DayPlan[];
  breakfastSummary: string;
  lunchSummary: string;
  dinnerSummary: string;
  generatedAt: string;
}

export interface GroceryQuantity {
  amount: number;
  unit: string;
}

export interface GroceryItem {
  id: number;
  name: string;
  quantities: GroceryQuantity[];
  toTaste: boolean;
  aisle: string;
}

export interface GroceryCategory {
  category: string;
  items: GroceryItem[];
}

export interface GroceryList {
  categories: GroceryCategory[];
  totalItems: number;
}

export interface GeneratePlanRequest {
  breakfastConstraints: string;
  lunchConstraints: string;
  dinnerConstraints: string;
}

export interface GeneratePlanResponse {
  mealPlan: MealPlan;
  groceryList: GroceryList;
}

export interface SpoonacularSearchParams {
  diet?: string;
  intolerances?: string;
  cuisine?: string;
  excludeCuisine?: string;
  maxReadyTime?: number;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  maxCarbs?: number;
  maxFat?: number;
  query?: string;
  constraintSummary: string;
}
