import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

// Interface for recipe ingredients
interface RecipeIngredientRequest {
  ingredient_id: string;
  deduct_quantity: number;
  deduct_stock?: number; // Optional - defaults to 0 for recipe creation
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
            quantity,
            purchase_price
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
    const { name, type, ingredients } = body;

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
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
          ingredient.deduct_quantity === undefined) {
          return NextResponse.json(
            { error: 'Each ingredient must have ingredient_id, deduct_quantity' },
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

        // Note: We don't check stock availability when creating recipes
        // Recipes are formulas/instructions, not actual production that consumes ingredients
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
          type,
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
        deduct_stock: ingredient.deduct_stock || 0, // Default to 0 for recipe creation
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
    const { id, name, type, ingredients, is_active } = body;

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
          ingredient.deduct_quantity === undefined) {
          return NextResponse.json(
            { error: 'Each ingredient must have ingredient_id, deduct_quantity' },
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
    const updateData: {
      name?: string;
      type?: string;
      is_active?: boolean;
    } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (is_active !== undefined) updateData.is_active = is_active;

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
          deduct_stock: ingredient.deduct_stock || 0, // Default to 0 for recipe updates
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
            quantity,
            purchase_price
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

// DELETE - Delete recipe with cascading deletion
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

    // First, get the recipe details for logging
    const { data: recipe, error: fetchError } = await supabaseServerClient
      .from('recipes')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching recipe:', fetchError);
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    console.log(`Starting deletion of recipe: ${recipe.name} (ID: ${id})`);

    // Step 1: Get all recipe ingredients that use this recipe
    const { data: recipeIngredients, error: riError } = await supabaseServerClient
      .from('recipe_ingredients')
      .select(`
        id,
        ingredient_id,
        ingredients (
          id,
          name,
          product_id
        )
      `)
      .eq('recipe_id', id)
      .is('product_id', null); // Only get base recipe ingredients, not product associations

    if (riError) {
      console.error('Error fetching recipe ingredients:', riError);
      return NextResponse.json(
        { error: 'Failed to fetch recipe ingredients' },
        { status: 500 }
      );
    }

    const deletedIngredientProducts: Array<{id: string, name: string, type: string}> = [];

    // Step 2: For each ingredient used by this recipe, check if it's an ingredient-type product
    if (recipeIngredients && recipeIngredients.length > 0) {
      for (const ri of recipeIngredients) {
        const ingredient = ri.ingredients as { id: string; name: string; product_id?: string } | { id: string; name: string; product_id?: string }[] | null;
        const ingredientData = Array.isArray(ingredient) ? ingredient[0] : ingredient;
        if (ingredientData && ingredientData.product_id) {
          // This ingredient has an associated product, check if it's ingredient-type
          const { data: product, error: productError } = await supabaseServerClient
            .from('products')
            .select('id, name, type')
            .eq('id', ingredientData.product_id)
            .single();

          if (!productError && product && product.type === 'ingredient') {
            console.log(`Found ingredient-type product to delete: ${product.name} (ID: ${product.id})`);

            // Delete the ingredient-type product
            const { error: productDeleteError } = await supabaseServerClient
              .from('products')
              .delete()
              .eq('id', product.id);

            if (productDeleteError) {
              console.error(`Error deleting ingredient-type product ${product.id}:`, productDeleteError);
              // Continue with deletion, don't fail the entire operation
            } else {
              deletedIngredientProducts.push(product);
              console.log(`Successfully deleted ingredient-type product: ${product.name}`);
            }
          }
        }
      }
    }

    // Step 3: Delete all recipe_ingredients entries for this recipe
    const { error: deleteRIError } = await supabaseServerClient
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id);

    if (deleteRIError) {
      console.error('Error deleting recipe ingredients:', deleteRIError);
      return NextResponse.json(
        { error: 'Failed to delete recipe ingredients' },
        { status: 500 }
      );
    }

    console.log(`Deleted ${recipeIngredients?.length || 0} recipe ingredient relationships`);

    // Step 4: Check if this recipe is being sold as a product and delete it from products table
    let deletedRecipeProduct = null;
    const { data: recipeProduct, error: recipeProductError } = await supabaseServerClient
      .from('products')
      .select('id, name, type')
      .eq('recipe_id', id)
      .single();

    if (!recipeProductError && recipeProduct) {
      console.log(`Found recipe being sold as product: ${recipeProduct.name} (ID: ${recipeProduct.id})`);

      // Delete the product that represents this recipe
      const { error: productDeleteError } = await supabaseServerClient
        .from('products')
        .delete()
        .eq('id', recipeProduct.id);

      if (productDeleteError) {
        console.error(`Error deleting recipe product ${recipeProduct.id}:`, productDeleteError);
        // Continue with deletion, don't fail the entire operation
      } else {
        deletedRecipeProduct = recipeProduct;
        console.log(`Successfully deleted recipe product: ${recipeProduct.name}`);
      }
    }

    // Step 5: Finally, delete the recipe itself
    const { error: deleteRecipeError } = await supabaseServerClient
      .from('recipes')
      .delete()
      .eq('id', id);

    if (deleteRecipeError) {
      console.error('Error deleting recipe:', deleteRecipeError);
      return NextResponse.json(
        { error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted recipe: ${recipe.name} (ID: ${id})`);

    return NextResponse.json({
      message: 'Recipe deleted successfully',
      deletedRecipe: {
        id: recipe.id,
        name: recipe.name
      },
      deletedIngredientProducts: deletedIngredientProducts,
      deletedRecipeProduct: deletedRecipeProduct,
      deletedRecipeIngredients: recipeIngredients?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

