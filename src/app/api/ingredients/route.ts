import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';
import { getCurrentUserInfo } from '@/lib/auditLogger';

// GET - Fetch all ingredients
export async function GET() {
  try {
    // First get all active ingredients (not soft deleted)
    const { data: ingredients, error } = await supabaseServerClient
      .from('ingredients')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching ingredients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ingredients' },
        { status: 500 }
      );
    }

    // For each ingredient, check if it has a corresponding product with recipe ingredients
    const ingredientsWithRecipeData = await Promise.all(
      ingredients.map(async (ingredient) => {
        // Check if this ingredient has a product_id (meaning it's linked to a product)
        if (ingredient.product_id) {
          try {
            // Fetch recipe ingredients for this product
            const { data: recipeIngredients } = await supabaseServerClient
              .from('recipe_ingredients')
              .select(`
                id,
                deduct_quantity,
                deduct_stock,
                ingredients (
                  name,
                  unit,
                  quantity,
                  purchase_price
                )
              `)
              .eq('product_id', ingredient.product_id)
              .is('recipe_id', null)
              .is('deleted_at', null);

            return {
              ...ingredient,
              recipe_ingredients: recipeIngredients || []
            };
          } catch (err) {
            console.error('Error fetching recipe ingredients for ingredient:', err);
            return ingredient;
          }
        }
        return ingredient;
      })
    );

    return NextResponse.json(ingredientsWithRecipeData);
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
    const { product_id, name, unit, quantity, stock, purchase_price, is_liquid, is_active, sale_price } = body;

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
          original_quantity: quantity ? parseFloat(quantity) : parseFloat(quantity) || 0,
          purchase_price: parseFloat(purchase_price) || 0,
          is_liquid: Boolean(is_liquid),
          is_active: Boolean(is_active),
          // sale_price: sale_price ? parseFloat(sale_price) : null,
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
    const { id, product_id, name, unit, quantity, stock, original_quantity, purchase_price, is_liquid, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Ingredient ID is required' },
        { status: 400 }
      );
    }

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
    const updateData: {
      product_id?: string | null;
      name?: string;
      unit?: string;
      quantity?: number;
      stock?: number;
      original_quantity?: number;
      purchase_price?: number;
      is_liquid?: boolean;
      is_active?: boolean;
    } = {};
    if (product_id !== undefined) updateData.product_id = product_id;
    if (name !== undefined) updateData.name = name.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (stock !== undefined) updateData.stock = parseFloat(stock);
    if (original_quantity !== undefined) updateData.original_quantity = parseFloat(original_quantity);
    if (purchase_price !== undefined) updateData.purchase_price = parseFloat(purchase_price);
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
        if (original_quantity !== undefined && parseFloat(original_quantity) !== currentIngredient.original_quantity) {
          changes.push(`Cantidad Original: ${currentIngredient.original_quantity} → ${parseFloat(original_quantity)}`);
        }
        if (unit !== undefined && unit !== currentIngredient.unit) {
          changes.push(`Unidad: "${currentIngredient.unit}" → "${unit}"`);
        }
        if (purchase_price !== undefined && parseFloat(purchase_price) !== currentIngredient.purchase_price) {
          changes.push(`Precio: ${currentIngredient.purchase_price} → ${parseFloat(purchase_price)}`);
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

// DELETE - Delete ingredient with cascading deletion
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

    // First, get the ingredient details for logging
    const { data: ingredient, error: fetchError } = await supabaseServerClient
      .from('ingredients')
      .select('id, name, product_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching ingredient:', fetchError);
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    console.log(`Starting deletion of ingredient: ${ingredient.name} (ID: ${id})`);

    // Step 0: Check if ingredient or its associated products are referenced in orders
    const referencesCheck = [];

    // Check if the ingredient's associated product (product_id) is used in orders
    if (ingredient.product_id) {
      const { data: orderItemsWithProduct, error: orderCheckError1 } = await supabaseServerClient
        .from('order_items')
        .select('id')
        .eq('product_id', ingredient.product_id)
        .limit(1);

      if (orderCheckError1) {
        console.error('Error checking order references for associated product:', orderCheckError1);
        return NextResponse.json(
          { error: 'Failed to check order references' },
          { status: 500 }
        );
      }

      if (orderItemsWithProduct && orderItemsWithProduct.length > 0) {
        referencesCheck.push(`El producto asociado "${ingredient.name}" ha sido usado en órdenes`);
      }
    }

    // Check if the ingredient is being sold as a product (ingredient_id reference) and used in orders
    const { data: ingredientProductCheck, error: ingredientProductCheckError } = await supabaseServerClient
      .from('products')
      .select('id, name')
      .eq('ingredient_id', id)
      .single();

    if (!ingredientProductCheckError && ingredientProductCheck) {
      const { data: orderItemsWithIngredientProduct, error: orderCheckError2 } = await supabaseServerClient
        .from('order_items')
        .select('id')
        .eq('product_id', ingredientProductCheck.id)
        .limit(1);

      if (orderCheckError2) {
        console.error('Error checking order references for ingredient product:', orderCheckError2);
        return NextResponse.json(
          { error: 'Failed to check order references' },
          { status: 500 }
        );
      }

      if (orderItemsWithIngredientProduct && orderItemsWithIngredientProduct.length > 0) {
        referencesCheck.push(`El ingrediente "${ingredient.name}" se vende como producto y ha sido usado en órdenes`);
      }
    }

    // Check if any recipes using this ingredient have products that are used in orders
    const { data: recipesUsingIngredientCheck, error: recipesCheckError } = await supabaseServerClient
      .from('recipe_ingredients')
      .select(`
        recipe_id,
        recipes (
          id,
          name
        )
      `)
      .eq('ingredient_id', id)
      .is('product_id', null);

    if (recipesCheckError) {
      console.error('Error fetching recipes using ingredient:', recipesCheckError);
      return NextResponse.json(
        { error: 'Failed to fetch recipes using this ingredient' },
        { status: 500 }
      );
    }

    if (recipesUsingIngredientCheck && recipesUsingIngredientCheck.length > 0) {
      const uniqueRecipeIds = Array.from(new Set(recipesUsingIngredientCheck.map(ri => ri.recipe_id)));

      for (const recipeId of uniqueRecipeIds) {
        // Check if this recipe has an associated product that's used in orders
        const { data: recipeProduct, error: recipeProductError } = await supabaseServerClient
          .from('products')
          .select('id, name')
          .eq('recipe_id', recipeId)
          .single();

        if (!recipeProductError && recipeProduct) {
          const { data: orderItemsWithRecipeProduct, error: orderCheckError3 } = await supabaseServerClient
            .from('order_items')
            .select('id')
            .eq('product_id', recipeProduct.id)
            .limit(1);

          if (orderCheckError3) {
            console.error('Error checking order references for recipe product:', orderCheckError3);
            return NextResponse.json(
              { error: 'Failed to check order references' },
              { status: 500 }
            );
          }

          if (orderItemsWithRecipeProduct && orderItemsWithRecipeProduct.length > 0) {
            const recipeInfo = recipesUsingIngredientCheck.find(ri => ri.recipe_id === recipeId);
            const recipe = recipeInfo?.recipes as { id: string; name: string } | { id: string; name: string }[];
            const recipeData = Array.isArray(recipe) ? recipe[0] : recipe;
            referencesCheck.push(`La receta "${recipeData?.name}" que usa este ingrediente ha sido vendida en órdenes`);
          }
        }
      }
    }

    // Initialize soft deletion tracking
    const deletedAt = new Date().toISOString();
    let softDeletedItems = {
      ingredients: 0,
      products: 0,
      recipeIngredients: 0
    };

    console.log(`Starting soft deletion of ingredient: ${ingredient.name} (ID: ${id})`);

    // 1. Soft delete the ingredient itself
    const { error: ingredientDeleteError } = await supabaseServerClient
      .from('ingredients')
      .update({ deleted_at: deletedAt })
      .eq('id', id);

    if (ingredientDeleteError) {
      console.error('Error soft deleting ingredient:', ingredientDeleteError);
      return NextResponse.json(
        { error: 'Failed to soft delete ingredient' },
        { status: 500 }
      );
    } else {
      softDeletedItems.ingredients++;
      console.log(`Soft deleted ingredient: ${ingredient.name}`);
    }

    // 2. Soft delete all recipe_ingredients that use this ingredient
    const { data: riData, error: riDeleteError } = await supabaseServerClient
      .from('recipe_ingredients')
      .update({ deleted_at: deletedAt })
      .eq('ingredient_id', id)
      .select('id');

    if (riDeleteError) {
      console.error('Error soft deleting recipe ingredients:', riDeleteError);
    } else if (riData && riData.length > 0) {
      softDeletedItems.recipeIngredients += riData.length;
      console.log(`Soft deleted ${riData.length} recipe ingredients that used this ingredient`);
    }

    // 3. Handle ingredient's associated product (product_id) - for sale case
    if (ingredient.product_id) {
      console.log(`Ingredient has associated product, soft deleting product: ${ingredient.product_id}`);

      const { error: productDeleteError } = await supabaseServerClient
        .from('products')
        .update({ deleted_at: deletedAt })
        .eq('id', ingredient.product_id);

      if (productDeleteError) {
        console.error('Error soft deleting associated product:', productDeleteError);
      } else {
        softDeletedItems.products++;
        console.log(`Soft deleted associated product: ${ingredient.product_id}`);
      }
    }

    // 4. Handle ingredient sold as product (ingredient_id reference) - for sale case
    if (ingredientProductCheck) {
      console.log(`Ingredient is sold as product, soft deleting product: ${ingredientProductCheck.id}`);

      const { error: ingredientProductDeleteError } = await supabaseServerClient
        .from('products')
        .update({ deleted_at: deletedAt })
        .eq('id', ingredientProductCheck.id);

      if (ingredientProductDeleteError) {
        console.error('Error soft deleting ingredient product:', ingredientProductDeleteError);
      } else {
        softDeletedItems.products++;
        console.log(`Soft deleted ingredient product: ${ingredientProductCheck.id}`);
      }
    }

    console.log(`Soft deletion completed for ingredient: ${ingredient.name}`);
    console.log('Soft deletion summary:', softDeletedItems);

    return NextResponse.json({
      message: 'Ingredient soft deleted successfully',
      deletedIngredient: {
        id: ingredient.id,
        name: ingredient.name
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
