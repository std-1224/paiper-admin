import { NextRequest, NextResponse } from 'next/server';
// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

// GET - Fetch recipe ingredients by recipe ID or product ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipe_id');
    const productId = searchParams.get('product_id');

    if (!recipeId && !productId) {
      return NextResponse.json(
        { error: 'Recipe ID or Product ID is required' },
        { status: 400 }
      );
    }

    let query = supabaseServerClient
      .from('recipe_ingredients')
      .select(`
        *,
        ingredients (
          id,
          name,
          unit,
          quantity,
          stock,
          is_liquid,
          product_id
        ),
        recipes (
          id,
          name,
          type,
          recipe_ingredients (
            *,
            ingredients (
              id,
              name,
              unit,
              quantity,
              stock
            )
          )
        )
      `);

    // Add appropriate filter based on provided parameter
    if (recipeId) {
      query = query.eq('recipe_id', recipeId).is('product_id', null);
    } else if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: recipeIngredients, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching recipe ingredients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipe ingredients' },
        { status: 500 }
      );
    }

    return NextResponse.json(recipeIngredients);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add ingredient link (to recipe or product)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipe_id, product_id, ingredient_id, deduct_quantity, deduct_stock } = body;

    // Validation: need deduct values and at least one of recipe_id or product_id
    // For individual ingredients: ingredient_id is required, recipe_id can be null
    // For recipes: recipe_id is required, ingredient_id should be null
    if (deduct_quantity === undefined || deduct_stock === undefined || (!recipe_id && !product_id)) {
      return NextResponse.json(
        { error: 'deduct_quantity, deduct_stock and one of recipe_id or product_id are required' },
        { status: 400 }
      );
    }

    // Additional validation: must have either ingredient_id OR recipe_id (not both, not neither)
    if (!ingredient_id && !recipe_id) {
      return NextResponse.json(
        { error: 'Either ingredient_id or recipe_id must be provided' },
        { status: 400 }
      );
    }

    if (ingredient_id && recipe_id) {
      return NextResponse.json(
        { error: 'Cannot have both ingredient_id and recipe_id - must be one or the other' },
        { status: 400 }
      );
    }

    // Validate recipe if provided
    if (recipe_id) {
      const { data: recipe } = await supabaseServerClient
        .from('recipes')
        .select('id')
        .eq('id', recipe_id)
        .single();

      if (!recipe) {
        return NextResponse.json(
          { error: 'Recipe not found' },
          { status: 404 }
        );
      }
    }

    // Validate ingredient exists (only if ingredient_id is provided)
    if (ingredient_id) {
      const { data: ingredient } = await supabaseServerClient
        .from('ingredients')
        .select('id')
        .eq('id', ingredient_id)
        .single();

      if (!ingredient) {
        return NextResponse.json(
          { error: 'Ingredient not found' },
          { status: 404 }
        );
      }
    }

    // Check for existing entry to avoid constraint violations
    let existingQuery = supabaseServerClient
      .from('recipe_ingredients')
      .select('id');

    if (ingredient_id && product_id) {
      // Individual ingredient linked to product case
      existingQuery = existingQuery
        .eq('ingredient_id', ingredient_id)
        .eq('product_id', product_id)
        .is('recipe_id', null);
    } else if (recipe_id && product_id) {
      // Recipe linked to product case
      existingQuery = existingQuery
        .eq('recipe_id', recipe_id)
        .eq('product_id', product_id)
        .is('ingredient_id', null);
    } else if (recipe_id && ingredient_id && !product_id) {
      // Base recipe case: recipe + ingredient where product_id is null
      existingQuery = existingQuery
        .eq('recipe_id', recipe_id)
        .eq('ingredient_id', ingredient_id)
        .is('product_id', null);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      return NextResponse.json(
        { error: 'This relation already exists' },
        { status: 409 }
      );
    }

    // Insert
    const { data: recipeIngredient, error } = await supabaseServerClient
      .from('recipe_ingredients')
      .insert([
        {
          recipe_id: recipe_id || null,
          product_id: product_id || null,
          ingredient_id: ingredient_id || null,
          deduct_quantity: parseFloat(deduct_quantity),
          deduct_stock: parseFloat(deduct_stock),
        },
      ])
      .select(`
        *,
        ingredients (
          name,
          unit,
          stock
        )
      `)
      .single();

    if (error) {
      console.error('Error creating recipe ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to add ingredient relation' },
        { status: 500 }
      );
    }

    return NextResponse.json(recipeIngredient, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Deduct system adjustments
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipe_id, product_id, ingredient_id, amount_to_create, quantity_per_unit } = body;

    if (!ingredient_id || (!recipe_id && !product_id)) {
      return NextResponse.json(
        { error: 'ingredient_id and one of recipe_id or product_id are required' },
        { status: 400 }
      );
    }

    // Fetch the row to update, compute new values, then update
    // Since Supabase JS cannot do arithmetic directly in update values

    let select = supabaseServerClient
      .from('recipe_ingredients')
      .select('id, deduct_stock, deduct_quantity')
      .eq('ingredient_id', ingredient_id);

    if (recipe_id) select = select.eq('recipe_id', recipe_id).is('product_id', null);
    if (product_id) select = select.eq('product_id', product_id).is('recipe_id', null);

    const { data, error } = await select.single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Relation not found for provided selector' },
        { status: 404 }
      );
    }

    const newDeductStock = Math.max(0, (Number(data.deduct_stock) || 0) - (Number(amount_to_create) || 0));
    const newDeductAmount = Math.max(0, (Number(data.deduct_quantity) || 0) - (Number(quantity_per_unit) || 0));

    const { error: updateErr } = await supabaseServerClient
      .from('recipe_ingredients')
      .update({ deduct_stock: newDeductStock, deduct_quantity: newDeductAmount })
      .eq('id', data.id);

    if (updateErr) {
      return NextResponse.json(
        { error: 'Failed to apply deduction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id, deduct_stock: newDeductStock, deduct_quantity: newDeductAmount }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove ingredient from recipe or all ingredients for a product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const productId = searchParams.get('product_id');

    if (!id && !productId) {
      return NextResponse.json(
        { error: 'Either recipe ingredient ID or product_id is required' },
        { status: 400 }
      );
    }

    let query = supabaseServerClient.from('recipe_ingredients').delete();

    if (productId) {
      // Delete all recipe ingredients for a specific product
      query = query.eq('product_id', productId);
    } else if (id) {
      // Delete a specific recipe ingredient by id
      query = query.eq('id', id);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting recipe ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to remove ingredient(s)' },
        { status: 500 }
      );
    }

    const message = productId
      ? 'All ingredients removed from product successfully'
      : 'Ingredient removed from recipe successfully';

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
