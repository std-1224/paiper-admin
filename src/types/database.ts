// Database types for Supabase

export interface Ingredient {
  id: string;
  product_id?: string | null;
  name: string;
  unit: string;
  quantity: number;
  stock: number;
  original_quantity: number;
  purchase_price?: number;
  is_liquid: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string | null;      // now nullable for individual ingredient links
  product_id: string | null;     // new link to product when not tied to a recipe
  ingredient_id: string;
  deduct_stock: number;
  deduct_quantity: number;
  created_at: string;
  updated_at: string;
  // Enhanced fields (populated when fetching recipe details)
  ingredient_name?: string;
  ingredient_unit?: string;
  available_stock?: number;
}

export interface Recipe {
  id: string;
  name: string;
  type: 'drink' | 'meal' | 'input';
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  // Populated when fetching with ingredients
  recipe_ingredients?: RecipeIngredient[];
}

// Request/Response types for API endpoints

export interface CreateIngredientRequest {
  product_id?: string;
  name: string;
  unit: string;
  quantity: number;
  stock?: number;
  is_liquid?: boolean;
}

export interface UpdateIngredientRequest {
  id?: string;
  product_id?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  stock?: number;
  is_liquid?: boolean;
}

export interface CreateRecipeIngredientRequest {
  ingredient_id: string;
  deduct_quantity: number;
  deduct_stock: number;
}

export interface CreateRecipeRequest {
  name: string;
  unit: string;
  quantity: number;
  type: 'drink' | 'meal' | 'input';
  stock?: number;
  ingredients?: CreateRecipeIngredientRequest[];
}

export interface UpdateRecipeRequest {
  id?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  type?: 'drink' | 'meal' | 'input';
  stock?: number;
  ingredients?: CreateRecipeIngredientRequest[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

// Supabase Database Schema Type
export interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: Ingredient;
        Insert: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>>;
      };
      recipes: {
        Row: Recipe;
        Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'recipe_ingredients'>;
        Update: Partial<Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'recipe_ingredients'>>;
      };
      recipe_ingredients: {
        Row: RecipeIngredient;
        Insert: Omit<RecipeIngredient, 'id' | 'created_at' | 'updated_at' | 'ingredient_name' | 'ingredient_unit' | 'available_stock'>;
        Update: Partial<Omit<RecipeIngredient, 'id' | 'created_at' | 'updated_at' | 'ingredient_name' | 'ingredient_unit' | 'available_stock'>>;
      };
    };
  };
}
