import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

// GET - Fetch single ingredient by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: ingredient, error } = await supabaseServerClient
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ingredient' },
        { status: 500 }
      );
    }

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update single ingredient by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { product_id, name, unit, quantity, stock, is_liquid, is_active, sale_price } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (product_id !== undefined) updateData.product_id = product_id;
    if (name !== undefined) updateData.name = name.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (stock !== undefined) updateData.stock = parseFloat(stock);
    if (is_liquid !== undefined) updateData.is_liquid = Boolean(is_liquid);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const { data: ingredient, error } = await supabaseServerClient
      .from('ingredients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to update ingredient' },
        { status: 500 }
      );
    }

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete single ingredient by ID
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if ingredient is used in any recipes
    const { data: recipes, error: recipesError } = await supabaseServerClient
      .from('recipes')
      .select('id, name, ingredients')
      .contains('ingredients', [{ ingredient_id: id }]);

    if (recipesError) {
      console.error('Error checking recipes:', recipesError);
      return NextResponse.json(
        { error: 'Failed to check ingredient usage' },
        { status: 500 }
      );
    }

    if (recipes && recipes.length > 0) {
      const recipeNames = recipes.map(r => r.name).join(', ');
      return NextResponse.json(
        { error: `Cannot delete ingredient. It is used in the following recipes: ${recipeNames}` },
        { status: 409 }
      );
    }

    const { error } = await supabaseServerClient
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to delete ingredient' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
