import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

// GET - Fetch all ingredients
export async function GET() {
  try {
    // First get all ingredients
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
              .is('recipe_id', null);

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
    const { id, product_id, name, unit, quantity, stock, purchase_price, is_liquid, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Ingredient ID is required' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: {
      product_id?: string | null;
      name?: string;
      unit?: string;
      quantity?: number;
      stock?: number;
      purchase_price?: number;
      is_liquid?: boolean;
      is_active?: boolean;
    } = {};
    if (product_id !== undefined) updateData.product_id = product_id;
    if (name !== undefined) updateData.name = name.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (stock !== undefined) updateData.stock = parseFloat(stock);
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

    // Step 1: Find all recipes that use this ingredient
    const { data: recipesUsingIngredient, error: recipesError } = await supabaseServerClient
      .from('recipe_ingredients')
      .select(`
        recipe_id,
        recipes (
          id,
          name
        )
      `)
      .eq('ingredient_id', id)
      .is('product_id', null); // Only get base recipe relationships, not product associations

    if (recipesError) {
      console.error('Error fetching recipes using ingredient:', recipesError);
      return NextResponse.json(
        { error: 'Failed to fetch recipes using this ingredient' },
        { status: 500 }
      );
    }

    const deletedRecipes: Array<{id: string, name: string}> = [];

    // Step 2: Delete all recipes that use this ingredient
    if (recipesUsingIngredient && recipesUsingIngredient.length > 0) {
      const uniqueRecipeIds = Array.from(new Set(recipesUsingIngredient.map(ri => ri.recipe_id)));

      for (const recipeId of uniqueRecipeIds) {
        const recipeInfo = recipesUsingIngredient.find(ri => ri.recipe_id === recipeId);

        if (recipeInfo && recipeInfo.recipes) {
          const recipe = recipeInfo.recipes as { id: string; name: string } | { id: string; name: string }[];
          const recipeData = Array.isArray(recipe) ? recipe[0] : recipe;

          console.log(`Deleting recipe that uses ingredient: ${recipeData.name} (ID: ${recipeId})`);

          // Delete the recipe (this will also delete its recipe_ingredients due to foreign key constraints)
          const { error: recipeDeleteError } = await supabaseServerClient
            .from('recipes')
            .delete()
            .eq('id', recipeId);

          if (recipeDeleteError) {
            console.error(`Error deleting recipe ${recipeId}:`, recipeDeleteError);
            // Continue with deletion, don't fail the entire operation
          } else {
            deletedRecipes.push({
              id: recipeId,
              name: recipeData.name
            });
            console.log(`Successfully deleted recipe: ${recipeData.name}`);
          }
        }
      }
    }

    // Step 3: Delete all recipe_ingredients entries for this ingredient
    const { error: deleteRIError } = await supabaseServerClient
      .from('recipe_ingredients')
      .delete()
      .eq('ingredient_id', id);

    if (deleteRIError) {
      console.error('Error deleting recipe ingredients:', deleteRIError);
      return NextResponse.json(
        { error: 'Failed to delete recipe ingredients' },
        { status: 500 }
      );
    }

    console.log(`Deleted recipe ingredient relationships for ingredient: ${ingredient.name}`);

    // Step 4: If this ingredient has an associated product, delete it too
    let deletedProduct = null;
    if (ingredient.product_id) {
      const { data: product, error: productFetchError } = await supabaseServerClient
        .from('products')
        .select('id, name, type')
        .eq('id', ingredient.product_id)
        .single();

      if (!productFetchError && product) {
        console.log(`Deleting associated product: ${product.name} (ID: ${product.id})`);

        const { error: productDeleteError } = await supabaseServerClient
          .from('products')
          .delete()
          .eq('id', product.id);

        if (productDeleteError) {
          console.error(`Error deleting associated product ${product.id}:`, productDeleteError);
          // Continue with deletion, don't fail the entire operation
        } else {
          deletedProduct = product;
          console.log(`Successfully deleted associated product: ${product.name}`);
        }
      }
    }

    // Step 5: Check if this ingredient is being sold as a product (ingredient_id reference) and delete it from products table
    let deletedIngredientProduct = null;
    const { data: ingredientProduct, error: ingredientProductError } = await supabaseServerClient
      .from('products')
      .select('id, name, type')
      .eq('ingredient_id', id)
      .single();

    if (!ingredientProductError && ingredientProduct) {
      console.log(`Found ingredient being sold as product: ${ingredientProduct.name} (ID: ${ingredientProduct.id})`);

      // Delete the product that represents this ingredient
      const { error: productDeleteError } = await supabaseServerClient
        .from('products')
        .delete()
        .eq('id', ingredientProduct.id);

      if (productDeleteError) {
        console.error(`Error deleting ingredient product ${ingredientProduct.id}:`, productDeleteError);
        // Continue with deletion, don't fail the entire operation
      } else {
        deletedIngredientProduct = ingredientProduct;
        console.log(`Successfully deleted ingredient product: ${ingredientProduct.name}`);
      }
    }

    // Step 5: Finally, delete the ingredient itself
    const { error: deleteIngredientError } = await supabaseServerClient
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (deleteIngredientError) {
      console.error('Error deleting ingredient:', deleteIngredientError);
      return NextResponse.json(
        { error: 'Failed to delete ingredient' },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted ingredient: ${ingredient.name} (ID: ${id})`);

    return NextResponse.json({
      message: 'Ingredient deleted successfully',
      deletedIngredient: {
        id: ingredient.id,
        name: ingredient.name
      },
      deletedRecipes: deletedRecipes,
      deletedProduct: deletedProduct,
      deletedIngredientProduct: deletedIngredientProduct,
      deletedRecipeIngredients: recipesUsingIngredient?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
