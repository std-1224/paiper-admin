import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';
import { getCurrentUserInfo } from '@/lib/auditLogger';

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
      .is('deleted_at', null)
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
    const { product_id, name, description, unit, quantity, stock, is_liquid, is_active, sale_price } = body;

    // Get current ingredient data for audit logging
    const { data: currentIngredient, error: fetchError } = await supabaseServerClient
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentIngredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (product_id !== undefined) updateData.product_id = product_id;
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
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

    // Create audit log for ingredient update
    try {
      const userInfo = await getCurrentUserInfo();
      if (userInfo) {
        // Create description of changes
        const changes = [];
        if (name !== undefined && name !== currentIngredient.name) {
          changes.push(`Nombre: "${currentIngredient.name}" → "${name}"`);
        }
        if (stock !== undefined && parseFloat(stock) !== currentIngredient.stock) {
          changes.push(`Stock: ${currentIngredient.stock} → ${parseFloat(stock)}`);
        }
        if (quantity !== undefined && parseFloat(quantity) !== currentIngredient.quantity) {
          changes.push(`Cantidad: ${currentIngredient.quantity} → ${parseFloat(quantity)}`);
        }
        if (unit !== undefined && unit !== currentIngredient.unit) {
          changes.push(`Unidad: "${currentIngredient.unit}" → "${unit}"`);
        }
        if (description !== undefined && description !== currentIngredient.description) {
          changes.push(`Descripción: "${currentIngredient.description || ''}" → "${description || ''}"`);
        }

        const changeDescription = changes.length > 0
          ? `Ingrediente actualizado: ${changes.join(', ')}`
          : 'Ingrediente actualizado sin cambios detectados';

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
            action_type: 'ingredient_update',
            target_type: 'ingredient',
            target_id: ingredient.id,
            target_name: ingredient.name,
            description: changeDescription,
            changes_before: currentIngredient,
            changes_after: ingredient,
            status: 'success'
          }),
        });
      }
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit logging fails
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
