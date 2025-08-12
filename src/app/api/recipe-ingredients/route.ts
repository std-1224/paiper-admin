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
          name,
          unit,
          stock
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
    const { recipe_id, product_id, ingredient_id, deduct_amount, deduct_stock } = body;

    // Validation: need an ingredient and at least one of recipe_id or product_id
    if (!ingredient_id || deduct_amount === undefined || deduct_stock === undefined || (!recipe_id && !product_id)) {
      return NextResponse.json(
        { error: 'ingredient_id, deduct_amount, deduct_stock and one of recipe_id or product_id are required' },
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

    // Validate ingredient exists
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

    // Check for existing entry to avoid constraint violations
    let existingQuery = supabaseServerClient
      .from('recipe_ingredients')
      .select('id')
      .eq('ingredient_id', ingredient_id);

    if (recipe_id && !product_id) {
      // Base recipe case: check recipe_id + ingredient_id where product_id is null
      existingQuery = existingQuery.eq('recipe_id', recipe_id).is('product_id', null);
    } else if (product_id) {
      // Product case: check product_id + ingredient_id
      existingQuery = existingQuery.eq('product_id', product_id);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      return NextResponse.json(
        { error: 'This ingredient relation already exists' },
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
          ingredient_id,
          deduct_amount: parseFloat(deduct_amount),
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
      .select('id, deduct_stock, deduct_amount')
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
    const newDeductAmount = Math.max(0, (Number(data.deduct_amount) || 0) - (Number(quantity_per_unit) || 0));

    const { error: updateErr } = await supabaseServerClient
      .from('recipe_ingredients')
      .update({ deduct_stock: newDeductStock, deduct_amount: newDeductAmount })
      .eq('id', data.id);

    if (updateErr) {
      return NextResponse.json(
        { error: 'Failed to apply deduction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id, deduct_stock: newDeductStock, deduct_amount: newDeductAmount }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove ingredient from recipe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Recipe ingredient ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseServerClient
      .from('recipe_ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recipe ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to remove ingredient from recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Ingredient removed from recipe successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
