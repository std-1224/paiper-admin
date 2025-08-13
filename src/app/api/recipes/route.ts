import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

// Interface for recipe ingredients
interface RecipeIngredientRequest {
  ingredient_id: string;
  deduct_quantity: number;
  deduct_stock: number;
}

// GET - Fetch all recipes with their ingredients
export async function GET() {
  try {
    const { data: recipes, error } = await supabaseServerClient
      .from('recipes')
      .select(`
        *,
        recipe_ingredients!inner (
          id,
          ingredient_id,
          deduct_quantity,
          deduct_stock,
          ingredients (
            name,
            unit,
            stock,
            quantity
          )
        )
      `)
      .is('recipe_ingredients.product_id', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching recipes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipes' },
        { status: 500 }
      );
    }

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new recipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, unit, quantity, type, stock, ingredients } = body;

    // Validation
    if (!name || !unit || quantity === undefined || !type) {
      return NextResponse.json(
        { error: 'Name, unit, quantity, and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['drink', 'meal', 'input'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Type must be one of: drink, meal, input' },
        { status: 400 }
      );
    }

    // Validate ingredients array
    if (ingredients && !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: 'Ingredients must be an array' },
        { status: 400 }
      );
    }

    // Validate each ingredient in the array
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        if (!ingredient.ingredient_id ||
            ingredient.deduct_quantity === undefined ||
            ingredient.deduct_stock === undefined) {
          return NextResponse.json(
            { error: 'Each ingredient must have ingredient_id, deduct_quantity, and deduct_stock' },
            { status: 400 }
          );
        }

        // Verify ingredient exists
        const { data: existingIngredient } = await supabaseServerClient
          .from('ingredients')
          .select('id, stock')
          .eq('id', ingredient.ingredient_id)
          .single();

        if (!existingIngredient) {
          return NextResponse.json(
            { error: `Ingredient with ID ${ingredient.ingredient_id} not found` },
            { status: 404 }
          );
        }

        // Check if there's enough stock
        if (existingIngredient.stock < ingredient.deduct_stock) {
          return NextResponse.json(
            { error: `Insufficient stock for ingredient ${ingredient.ingredient_id}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if recipe with same name already exists
    const { data: existingRecipe } = await supabaseServerClient
      .from('recipes')
      .select('id')
      .eq('name', name)
      .single();

    if (existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe with this name already exists' },
        { status: 409 }
      );
    }

    // Start a transaction to create recipe and its ingredients
    const { data: recipe, error: recipeError } = await supabaseServerClient
      .from('recipes')
      .insert([
        {
          name: name.trim(),
          unit,
          quantity: parseFloat(quantity) || 0,
          type,
          stock: parseFloat(stock) || 0,
        },
      ])
      .select()
      .single();

    if (recipeError) {
      console.error('Error creating recipe:', recipeError);
      return NextResponse.json(
        { error: 'Failed to create recipe' },
        { status: 500 }
      );
    }

    // Insert recipe ingredients if provided
    if (ingredients && ingredients.length > 0) {
      // FIXED: Check for duplicate ingredients in the request and remove duplicates
      const uniqueIngredients = ingredients.filter((ingredient: RecipeIngredientRequest, index: number, self: RecipeIngredientRequest[]) =>
        index === self.findIndex(i => i.ingredient_id === ingredient.ingredient_id)
      );

      if (uniqueIngredients.length !== ingredients.length) {
        console.warn(`Removed ${ingredients.length - uniqueIngredients.length} duplicate ingredients from recipe`);
      }

      // Check if any of these recipe ingredients already exist
      const { data: existingRecipeIngredients } = await supabaseServerClient
        .from('recipe_ingredients')
        .select('ingredient_id')
        .eq('recipe_id', recipe.id)
        .in('ingredient_id', uniqueIngredients.map((i: RecipeIngredientRequest) => i.ingredient_id));

      if (existingRecipeIngredients && existingRecipeIngredients.length > 0) {
        const existingIds = existingRecipeIngredients.map(ri => ri.ingredient_id);
        console.error('Duplicate recipe ingredients found:', existingIds);
        // Rollback: delete the created recipe
        await supabaseServerClient.from('recipes').delete().eq('id', recipe.id);
        return NextResponse.json(
          { error: `Recipe ingredients already exist for ingredient IDs: ${existingIds.join(', ')}` },
          { status: 409 }
        );
      }

      const recipeIngredients = uniqueIngredients.map((ingredient: RecipeIngredientRequest) => ({
        recipe_id: recipe.id,
        ingredient_id: ingredient.ingredient_id,
        deduct_quantity: ingredient.deduct_quantity,
        deduct_stock: ingredient.deduct_stock,
      }));

      const { error: ingredientsError } = await supabaseServerClient
        .from('recipe_ingredients')
        .insert(recipeIngredients);

      if (ingredientsError) {
        console.error('Error creating recipe ingredients:', ingredientsError);
        // Rollback: delete the created recipe
        await supabaseServerClient.from('recipes').delete().eq('id', recipe.id);
        return NextResponse.json(
          { error: 'Failed to create recipe ingredients' },
          { status: 500 }
        );
      }
    }

    // Fetch the complete recipe with ingredients
    const { data: completeRecipe, error: fetchError } = await supabaseServerClient
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          ingredient_id,
          deduct_quantity,
          deduct_stock,
          ingredients (
            name,
            unit,
            stock
          )
        )
      `)
      .eq('id', recipe.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete recipe:', fetchError);
      return NextResponse.json(recipe, { status: 201 });
    }

    return NextResponse.json(completeRecipe, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update recipe
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, unit, quantity, type, stock, ingredients } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['drink', 'meal', 'input'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Type must be one of: drink, meal, input' },
          { status: 400 }
        );
      }
    }

    // Validate ingredients array if provided
    if (ingredients && !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: 'Ingredients must be an array' },
        { status: 400 }
      );
    }

    // Validate each ingredient in the array if provided
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        if (!ingredient.ingredient_id ||
            ingredient.deduct_quantity === undefined ||
            ingredient.deduct_stock === undefined) {
          return NextResponse.json(
            { error: 'Each ingredient must have ingredient_id, deduct_quantity, and deduct_stock' },
            { status: 400 }
          );
        }

        // Verify ingredient exists
        const { data: existingIngredient } = await supabaseServerClient
          .from('ingredients')
          .select('id')
          .eq('id', ingredient.ingredient_id)
          .single();

        if (!existingIngredient) {
          return NextResponse.json(
            { error: `Ingredient with ID ${ingredient.ingredient_id} not found` },
            { status: 404 }
          );
        }
      }
    }

    // Build update object with only provided fields (excluding ingredients)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (type !== undefined) updateData.type = type;
    if (stock !== undefined) updateData.stock = parseFloat(stock);

    // Update the recipe
    const { data: recipe, error: recipeError } = await supabaseServerClient
      .from('recipes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (recipeError) {
      console.error('Error updating recipe:', recipeError);
      return NextResponse.json(
        { error: 'Failed to update recipe' },
        { status: 500 }
      );
    }

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Update ingredients if provided
    if (ingredients !== undefined) {
      // Delete existing recipe ingredients
      const { error: deleteError } = await supabaseServerClient
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (deleteError) {
        console.error('Error deleting existing recipe ingredients:', deleteError);
        return NextResponse.json(
          { error: 'Failed to update recipe ingredients' },
          { status: 500 }
        );
      }

      // Insert new recipe ingredients if any
      if (ingredients.length > 0) {
        const recipeIngredients = ingredients.map((ingredient: RecipeIngredientRequest) => ({
          recipe_id: id,
          ingredient_id: ingredient.ingredient_id,
          deduct_quantity: ingredient.deduct_quantity,
          deduct_stock: ingredient.deduct_stock,
        }));

        const { error: insertError } = await supabaseServerClient
          .from('recipe_ingredients')
          .insert(recipeIngredients);

        if (insertError) {
          console.error('Error inserting new recipe ingredients:', insertError);
          return NextResponse.json(
            { error: 'Failed to update recipe ingredients' },
            { status: 500 }
          );
        }
      }
    }

    // Fetch the complete updated recipe with ingredients
    const { data: completeRecipe, error: fetchError } = await supabaseServerClient
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          ingredient_id,
          deduct_quantity,
          deduct_stock,
          ingredients (
            name,
            unit,
            stock
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete recipe:', fetchError);
      return NextResponse.json(recipe);
    }

    return NextResponse.json(completeRecipe);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete recipe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseServerClient
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recipe:', error);
      return NextResponse.json(
        { error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

