import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';
import { getCurrentUserInfo } from '@/lib/auditLogger';

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
      .is('deleted_at', null)
      .is('recipe_ingredients.product_id', null)
      .is('recipe_ingredients.deleted_at', null)
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

    // Get current recipe data for audit logging
    const { data: currentRecipe, error: currentFetchError } = await supabaseServerClient
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (currentFetchError || !currentRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
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
      .is('deleted_at', null)
      .is('recipe_ingredients.deleted_at', null)
      .single();

    if (fetchError) {
      console.error('Error fetching complete recipe:', fetchError);
      return NextResponse.json(recipe);
    }

    // Create audit log for recipe update
    try {
      const userInfo = await getCurrentUserInfo();
      if (userInfo) {
        // Create description of changes
        const changes = [];
        if (name !== undefined && name !== currentRecipe.name) {
          changes.push(`Nombre: "${currentRecipe.name}" → "${name}"`);
        }
        if (type !== undefined && type !== currentRecipe.type) {
          changes.push(`Tipo: "${currentRecipe.type}" → "${type}"`);
        }
        if (is_active !== undefined && is_active !== currentRecipe.is_active) {
          changes.push(`Estado: ${currentRecipe.is_active ? 'Activo' : 'Inactivo'} → ${is_active ? 'Activo' : 'Inactivo'}`);
        }
        if (ingredients !== undefined) {
          changes.push('Ingredientes actualizados');
        }

        const changeDescription = changes.length > 0
          ? `Receta actualizada: ${changes.join(', ')}`
          : 'Receta actualizada sin cambios detectados';

        await fetch(`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/api/audit-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userInfo.user_id,
            user_name: userInfo.user_name,
            user_email: userInfo.user_email,
            user_role: userInfo.user_role,
            action: 'update',
            action_type: 'recipe_update',
            target_type: 'recipe',
            target_id: completeRecipe.id,
            target_name: completeRecipe.name,
            description: changeDescription,
            changes_before: currentRecipe,
            changes_after: completeRecipe,
            status: 'success'
          }),
        });
      }
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit logging fails
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

    console.log(`Starting soft deletion of recipe: ${recipe.name} (ID: ${id})`);

    // Initialize soft deletion tracking
    const deletedAt = new Date().toISOString();
    const softDeletedItems = {
      recipes: 0,
      products: 0,
      recipeIngredients: 0
    };

    // Step 0: Check if recipe is being sold as a product and handle it
    const { data: recipeProductCheck, error: recipeProductCheckError } = await supabaseServerClient
      .from('products')
      .select('id, name')
      .eq('recipe_id', id)
      .single();

    if (!recipeProductCheckError && recipeProductCheck) {
      // Check if this recipe product is used in orders
      const { data: orderItems, error: orderCheckError } = await supabaseServerClient
        .from('order_items')
        .select('id, order_id')
        .eq('product_id', recipeProductCheck.id);

      if (orderCheckError) {
        console.error('Error checking order references for recipe product:', orderCheckError);
        return NextResponse.json(
          { error: 'Failed to check order references' },
          { status: 500 }
        );
      }

      // For sale case: soft delete the recipe product
      if (orderItems && orderItems.length > 0) {
        console.log(`Recipe ${recipe.name} product has been used in orders. Soft deleting recipe product.`);
      }

      // Soft delete the recipe product
      const { error: productDeleteError } = await supabaseServerClient
        .from('products')
        .update({ deleted_at: deletedAt })
        .eq('id', recipeProductCheck.id);

      if (productDeleteError) {
        console.error('Error soft deleting recipe product:', productDeleteError);
        return NextResponse.json(
          { error: 'Failed to soft delete recipe product' },
          { status: 500 }
        );
      } else {
        softDeletedItems.products++;
        console.log(`Soft deleted recipe product: ${recipeProductCheck.name}`);
      }
    }

    // Step 1: Soft delete the recipe itself
    const { error: recipeDeleteError } = await supabaseServerClient
      .from('recipes')
      .update({ deleted_at: deletedAt })
      .eq('id', id);

    if (recipeDeleteError) {
      console.error('Error soft deleting recipe:', recipeDeleteError);
      return NextResponse.json(
        { error: 'Failed to soft delete recipe' },
        { status: 500 }
      );
    } else {
      softDeletedItems.recipes++;
      console.log(`Soft deleted recipe: ${recipe.name}`);
    }

    // Step 2: Soft delete all recipe_ingredients for this recipe
    const { data: riData, error: riDeleteError } = await supabaseServerClient
      .from('recipe_ingredients')
      .update({ deleted_at: deletedAt })
      .eq('recipe_id', id)
      .select('id');

    if (riDeleteError) {
      console.error('Error soft deleting recipe ingredients:', riDeleteError);
    } else if (riData && riData.length > 0) {
      softDeletedItems.recipeIngredients += riData.length;
      console.log(`Soft deleted ${riData.length} recipe ingredients`);
    }

    console.log(`Soft deletion completed for recipe: ${recipe.name}`);
    console.log('Soft deletion summary:', softDeletedItems);

    return NextResponse.json({
      message: 'Recipe soft deleted successfully',
      deletedRecipe: {
        id: recipe.id,
        name: recipe.name
      },
      softDeletedItems: softDeletedItems,
      deletedAt: deletedAt
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

