import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';
import { getCurrentUserInfo } from '@/lib/auditLogger';
// GET - Fetch single recipe by ID with ingredient details
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: recipe, error } = await supabaseServerClient
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
      `).eq('id', id)
      .is('deleted_at', null)
      .is('recipe_ingredients.product_id', null)
      .is('recipe_ingredients.deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipe' },
        { status: 500 }
      );
    }

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update single recipe by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, unit, quantity, type, ingredients } = body;

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
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (type !== undefined) updateData.type = type;

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
        const recipeIngredients = ingredients.map((ingredient: any) => ({
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
            quantity
          )
        )
      `)
      .eq('id', id)
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
        if (unit !== undefined && unit !== currentRecipe.unit) {
          changes.push(`Unidad: "${currentRecipe.unit}" → "${unit}"`);
        }
        if (quantity !== undefined && parseFloat(quantity) !== currentRecipe.quantity) {
          changes.push(`Cantidad: ${currentRecipe.quantity} → ${parseFloat(quantity)}`);
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

// DELETE - Delete single recipe by ID
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
