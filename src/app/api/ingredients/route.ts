import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

// GET - Fetch all ingredients
export async function GET() {
  try {
    const { data: ingredients, error } = await supabaseServerClient
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching ingredients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ingredients' },
        { status: 500 }
      );
    }

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new ingredient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, name, unit, quantity, stock, is_liquid } = body;

    // Validation
    if (!name || !unit || quantity === undefined) {
      return NextResponse.json(
        { error: 'Name, unit, and quantity are required' },
        { status: 400 }
      );
    }

    // Check if ingredient with same name already exists
    const { data: existingIngredient } = await supabaseServerClient
      .from('ingredients')
      .select('id')
      .eq('name', name)
      .single();

    if (existingIngredient) {
      return NextResponse.json(
        { error: 'Ingredient with this name already exists' },
        { status: 409 }
      );
    }

    const { data: ingredient, error } = await supabaseServerClient
      .from('ingredients')
      .insert([
        {
          product_id: product_id || null,
          name: name.trim(),
          unit,
          quantity: parseFloat(quantity) || 0,
          stock: parseFloat(stock) || 0,
          is_liquid: Boolean(is_liquid),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to create ingredient' },
        { status: 500 }
      );
    }

    return NextResponse.json(ingredient, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update ingredient
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, product_id, name, unit, quantity, stock, is_liquid } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Ingredient ID is required' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (product_id !== undefined) updateData.product_id = product_id;
    if (name !== undefined) updateData.name = name.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (stock !== undefined) updateData.stock = parseFloat(stock);
    if (is_liquid !== undefined) updateData.is_liquid = Boolean(is_liquid);

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

// DELETE - Delete ingredient
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ingredient ID is required' },
        { status: 400 }
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
