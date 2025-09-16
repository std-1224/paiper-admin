import { NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

/**
 * Handle ingredient product sale (when product type is "ingredient")
 * This deducts from both the product stock and the linked ingredient stock
 */
async function deductIngredientProductSale(
  productId: string,
  orderQuantity: number
): Promise<boolean> {
  try {
    // First, deduct from the product stock
    const { data: product, error: productError } = await supabaseServerClient
      .from("products")
      .select("id, name, stock, type")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return false;
    }

    if (product.stock < orderQuantity) {
      throw new Error(
        `Insufficient product stock for ${product.name}: Available: ${product.stock}, Required: ${orderQuantity}`
      );
    }

    // Update product stock
    const { error: productUpdateError } = await supabaseServerClient
      .from("products")
      .update({ stock: product.stock - orderQuantity })
      .eq("id", productId);

    if (productUpdateError) {
      throw productUpdateError;
    }

    // Now find and deduct from the linked ingredient
    const { data: ingredient, error: ingredientError } = await supabaseServerClient
      .from("ingredients")
      .select("id, name, stock, quantity, original_quantity, product_id")
      .eq("product_id", productId)
      .single();

    if (ingredientError || !ingredient) {
      console.log(`No linked ingredient found for product ${productId}`);
      return true; // Product deduction was successful, ingredient link might not exist
    }

    console.log(`Deducting ingredient linked to product: ${ingredient.name}, need ${orderQuantity} units, current: stock=${ingredient.stock}, quantity=${ingredient.quantity}`);

    // Deduct from ingredient stock (simple stock deduction for ingredient products)
    if (ingredient.stock < orderQuantity) {
      throw new Error(
        `Insufficient ingredient stock for ${ingredient.name}: Available: ${ingredient.stock}, Required: ${orderQuantity}`
      );
    }

    const newIngredientStock = ingredient.stock - orderQuantity;

    const { error: ingredientUpdateError } = await supabaseServerClient
      .from("ingredients")
      .update({ stock: newIngredientStock })
      .eq("id", ingredient.id);

    if (ingredientUpdateError) {
      throw ingredientUpdateError;
    }

    console.log(`Successfully deducted from ingredient: newStock=${newIngredientStock}`);
    return true;

  } catch (error) {
    throw error;
  }
}

async function deductInventory(
  productId: string,
  orderQuantity: number,
  barId: number
): Promise<boolean> {
  try {
    const { data: product, error: productError } = await supabaseServerClient
      .from("products")
      .select(`
        id, name, type, stock, has_recipe, ingredient_id, recipe_id
      `)
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return false;
    }

    // Case 1: Product type is ingredient - deduct from linked ingredient
    if (product.type === "ingredient") {
      return await deductIngredientProductSale(productId, orderQuantity);
    }

    // Case 2: Direct ingredient sale (product has ingredient_id)
    if (product.ingredient_id) {
      return await deductDirectIngredientSale(product.ingredient_id, orderQuantity, productId);
    }

    // Case 3: Direct recipe sale (product has recipe_id)
    if (product.recipe_id) {
      return await deductDirectRecipeSale(product.recipe_id, orderQuantity, productId);
    }

    // Case 4: Product with recipe_ingredients (complex products)
    if (product.has_recipe) {
      return await deductFromRecipeIngredients(productId, orderQuantity);
    }

    // Case 5: Simple product without ingredients/recipes
    return await deductDirectProductStock(productId, orderQuantity);

  } catch (error) {
    throw error;
  }
}

async function deductFromRecipeIngredients(
  productId: string,
  orderQuantity: number
): Promise<boolean> {
  try {
    const { data: recipeIngredients, error: recipeError } = await supabaseServerClient
      .from("recipe_ingredients")
      .select(`
        id,
        recipe_id,
        ingredient_id,
        deduct_stock,
        deduct_quantity,
        ingredients (
          id,
          name,
          stock,
          quantity,
          unit,
          is_liquid,
          product_id,
          original_quantity
        ),
        recipes (
          id,
          name,
          type
        )
      `)
      .eq("product_id", productId);

    if (recipeError) {
      return false;
    }

    if (!recipeIngredients || recipeIngredients.length === 0) {
      return false;
    }

    // Group ingredients by ingredient_id to combine multiple entries for the same ingredient
    const ingredientGroups: { [key: string]: any } = {};

    for (const recipeIngredient of recipeIngredients) {
      if (recipeIngredient.ingredient_id && recipeIngredient.ingredients) {
        const ingredientId = recipeIngredient.ingredient_id;
        if (!ingredientGroups[ingredientId]) {
          ingredientGroups[ingredientId] = {
            ingredient: recipeIngredient.ingredients,
            totalDeductQuantity: 0,
            entries: []
          };
        }

        ingredientGroups[ingredientId].totalDeductQuantity += recipeIngredient.deduct_quantity;
        ingredientGroups[ingredientId].entries.push(recipeIngredient);
      } else if (recipeIngredient.recipe_id && recipeIngredient.recipes) {
        await deductRecipeFromRecipeIngredient(
          recipeIngredient,
          orderQuantity
        );
      }
    }

    // Process grouped ingredients
    for (const ingredientId in ingredientGroups) {
      const group = ingredientGroups[ingredientId];
      // Create a combined recipe ingredient entry
      const combinedEntry = {
        ingredients: group.ingredient,
        deduct_quantity: group.totalDeductQuantity,
        deduct_stock: 0
      };

      await deductIndividualIngredientFromRecipeIngredient(
        combinedEntry,
        orderQuantity
      );
    }

    await updateProductStock(productId, orderQuantity);
    return true;

  } catch (error) {
    throw error;
  }
}

async function deductDirectProductStock(
  productId: string,
  orderQuantity: number
): Promise<boolean> {
  try {
    const { data: product, error: productError } = await supabaseServerClient
      .from("products")
      .select("id, name, stock")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return false;
    }

    if (product.stock < orderQuantity) {
      throw new Error(
        `Insufficient stock for ${product.name}: Available: ${product.stock}, Required: ${orderQuantity}`
      );
    }

    const { error: updateError } = await supabaseServerClient
      .from("products")
      .update({ stock: product.stock - orderQuantity })
      .eq("id", productId);

    if (updateError) {
      throw updateError;
    }

    return true;

  } catch (error) {
    throw error;
  }
}

async function deductIndividualIngredientFromRecipeIngredient(
  recipeIngredient: any,
  orderQuantity: number
) {
  const ingredient = recipeIngredient.ingredients;

  // Calculate total consumption needed
  const quantityPerRecipe = recipeIngredient.deduct_quantity; // e.g., 60ml per cocktail
  const totalConsumption = quantityPerRecipe * orderQuantity; // e.g., 60ml × 1 = 60ml

  console.log(`Deducting ${ingredient.name}: need ${totalConsumption}${ingredient.unit}, current: stock=${ingredient.stock}, quantity=${ingredient.quantity}, original_quantity=${ingredient.original_quantity}`);

  let newStock = ingredient.stock;
  let newQuantity = ingredient.quantity;

  // Check if current opened quantity is sufficient
  if (totalConsumption <= ingredient.quantity) {
    // We have enough in the current opened unit - just deduct from current quantity
    newQuantity = ingredient.quantity - totalConsumption;
    // Stock remains the same since we didn't open a new unit
    console.log(`Using current opened unit: newStock=${newStock}, newQuantity=${newQuantity}`);
  } else {
    // We need to open new stock units
    // First, consume what's left in the current opened unit
    let remainingNeeded = totalConsumption - ingredient.quantity;

    // Validate we have enough stock to open new units
    if (ingredient.stock < 1) {
      throw new Error(
        `Insufficient stock for ${ingredient.name}: Available: ${ingredient.stock}, Required: at least 1 unit for ${totalConsumption}${ingredient.unit || 'units'}`
      );
    }

    // Open one new unit (reduce stock by 1)
    newStock = ingredient.stock - 1;

    // The new opened unit starts with original_quantity, then we consume remainingNeeded
    newQuantity = ingredient.original_quantity - remainingNeeded;

    console.log(`Opening new unit: consumed ${ingredient.quantity} from current + ${remainingNeeded} from new unit. newStock=${newStock}, newQuantity=${newQuantity}`);

    // Handle case where we need multiple new units (for very large consumption)
    while (remainingNeeded > ingredient.original_quantity && newStock > 0) {
      const additionalConsumption = remainingNeeded - ingredient.original_quantity;
      newStock = newStock - 1;

      if (additionalConsumption >= ingredient.original_quantity) {
        // Need to consume entire additional unit and possibly more
        newQuantity = ingredient.original_quantity;
        remainingNeeded = additionalConsumption - ingredient.original_quantity;
      } else {
        // Partial consumption of the additional unit
        newQuantity = ingredient.original_quantity - additionalConsumption;
        break;
      }
    }
  }

  // Ensure values don't go negative
  newStock = Math.max(0, newStock);
  newQuantity = Math.max(0, newQuantity);

  const { error: updateError } = await supabaseServerClient
    .from("ingredients")
    .update({
      stock: newStock,
      quantity: newQuantity,
    })
    .eq("id", ingredient.id);

  if (updateError) {
    throw updateError;
  }

  if (ingredient.product_id) {
    await updateAssociatedProduct(ingredient.product_id, newStock, newQuantity);
  }
}

async function deductRecipeFromRecipeIngredient(
  recipeIngredient: any,
  orderQuantity: number
) {
  const recipe = recipeIngredient.recipes;
  // Based on the expected calculation: (5g × 2 units) + (15g × 2 units) = 40g
  // The recipe part should be: recipe_requirement_per_recipe × recipes_in_product × orderQuantity
  // But the expected result suggests: recipe_requirement_per_recipe × orderQuantity
  // This means deduct_stock should represent the TOTAL requirement per unit, not number of recipes
  const recipesToCreate = recipeIngredient.deduct_stock * orderQuantity;

  const { data: recipeIngredients, error: recipeError } = await supabaseServerClient
    .from("recipe_ingredients")
    .select(`
      id,
      deduct_stock,
      deduct_quantity,
      ingredients (
        id, name, stock, quantity, unit, product_id, original_quantity
      )
    `)
    .eq("recipe_id", recipe.id)
    .is("product_id", null);

  if (recipeError || !recipeIngredients) {
    return;
  }

  for (const ri of recipeIngredients) {
    const ingredient = ri.ingredients as any;
    if (!ingredient) continue;

    // Calculate total consumption needed for this ingredient
    const quantityPerRecipe = ri.deduct_quantity; // e.g., 60ml per cocktail
    const totalConsumption = quantityPerRecipe * recipesToCreate; // e.g., 60ml × 1 = 60ml

    console.log(`Deducting ${ingredient.name}: need ${totalConsumption}${ingredient.unit}, current: stock=${ingredient.stock}, quantity=${ingredient.quantity}, original_quantity=${ingredient.original_quantity}`);

    let newStock = ingredient.stock;
    let newQuantity = ingredient.quantity;

    // Check if current opened quantity is sufficient
    if (totalConsumption <= ingredient.quantity) {
      // We have enough in the current opened unit - just deduct from current quantity
      newQuantity = ingredient.quantity - totalConsumption;
      // Stock remains the same since we didn't open a new unit
      console.log(`Using current opened unit: newStock=${newStock}, newQuantity=${newQuantity}`);
    } else {
      // We need to open new stock units
      // First, consume what's left in the current opened unit
      let remainingNeeded = totalConsumption - ingredient.quantity;

      // Validate we have enough stock to open new units
      if (ingredient.stock < 1) {
        throw new Error(
          `Insufficient stock for ${ingredient.name}: Available: ${ingredient.stock}, Required: at least 1 unit for ${totalConsumption}${ingredient.unit || 'units'}`
        );
      }

      // Open one new unit (reduce stock by 1)
      newStock = ingredient.stock - 1;

      // The new opened unit starts with original_quantity, then we consume remainingNeeded
      newQuantity = ingredient.original_quantity - remainingNeeded;

      console.log(`Opening new unit: consumed ${ingredient.quantity} from current + ${remainingNeeded} from new unit. newStock=${newStock}, newQuantity=${newQuantity}`);

      // Handle case where we need multiple new units (for very large consumption)
      while (remainingNeeded > ingredient.original_quantity && newStock > 0) {
        const additionalConsumption = remainingNeeded - ingredient.original_quantity;
        newStock = newStock - 1;

        if (additionalConsumption >= ingredient.original_quantity) {
          // Need to consume entire additional unit and possibly more
          newQuantity = ingredient.original_quantity;
          remainingNeeded = additionalConsumption - ingredient.original_quantity;
        } else {
          // Partial consumption of the additional unit
          newQuantity = ingredient.original_quantity - additionalConsumption;
          break;
        }
      }
    }

    // Ensure values don't go negative
    newStock = Math.max(0, newStock);
    newQuantity = Math.max(0, newQuantity);

    const { error: updateError } = await supabaseServerClient
      .from("ingredients")
      .update({ stock: newStock, quantity: newQuantity })
      .eq("id", ingredient.id);

    if (updateError) {
      throw updateError;
    }

    if (ingredient.product_id) {
      await updateAssociatedProduct(ingredient.product_id, newStock, newQuantity);
    }
  }
}

async function updateProductStock(productId: string, orderQuantity: number) {
  const { data: product, error: productError } = await supabaseServerClient
    .from("products")
    .select("id, name, stock")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return;
  }

  if (product.stock < orderQuantity) {
    throw new Error(
      `Insufficient product stock for ${product.name}: Available: ${product.stock}, Required: ${orderQuantity}`
    );
  }

  const { error: updateError } = await supabaseServerClient
    .from("products")
    .update({ stock: product.stock - orderQuantity })
    .eq("id", productId);

  if (updateError) {
    throw updateError;
  }
}

async function updateAssociatedProduct(productId: string, newStock: number, newQuantity: number) {
  const { error: updateError } = await supabaseServerClient
    .from("products")
    .update({ stock: newStock, quantity: newQuantity })
    .eq("id", productId);

  if (updateError) {
    throw updateError;
  }
}

/**
 * Handle direct ingredient sale (when product has ingredient_id)
 * This is for selling individual ingredients as products
 */
async function deductDirectIngredientSale(
  ingredientId: string,
  orderQuantity: number,
  productId: string
): Promise<boolean> {
  try {
    const { data: ingredient, error: ingredientError } = await supabaseServerClient
      .from("ingredients")
      .select("id, name, stock, quantity, unit")
      .eq("id", ingredientId)
      .single();

    if (ingredientError || !ingredient) {
      return false;
    }

    // For direct ingredient sales, deduct from ingredient stock
    if (ingredient.stock < orderQuantity) {
      throw new Error(
        `Insufficient stock for ${ingredient.name}: Available: ${ingredient.stock}, Required: ${orderQuantity}`
      );
    }

    const newStock = ingredient.stock - orderQuantity;

    // Update ingredient stock
    const { error: updateError } = await supabaseServerClient
      .from("ingredients")
      .update({ stock: newStock })
      .eq("id", ingredientId);

    if (updateError) {
      throw updateError;
    }

    // Update the product stock to match ingredient stock
    await updateProductStock(productId, orderQuantity);

    return true;

  } catch (error) {
    throw error;
  }
}

/**
 * Handle direct recipe sale (when product has recipe_id)
 * This is for selling individual recipes as products
 */
async function deductDirectRecipeSale(
  recipeId: string,
  orderQuantity: number,
  productId: string
): Promise<boolean> {
  try {
    // Get all ingredients for this recipe
    const { data: recipeIngredients, error: recipeError } = await supabaseServerClient
      .from("recipe_ingredients")
      .select(`
        id,
        deduct_stock,
        deduct_quantity,
        ingredients (
          id, name, stock, quantity, unit, product_id, original_quantity
        )
      `)
      .eq("recipe_id", recipeId)
      .is("product_id", null); // Only get recipe ingredients, not product ingredients

    if (recipeError || !recipeIngredients) {
      return false;
    }

    // Process each ingredient in the recipe
    for (const ri of recipeIngredients) {
      const ingredient = ri.ingredients as any;
      if (!ingredient) continue;

      // Calculate total consumption needed for this ingredient
      const deductQuantity = ri.deduct_quantity; // Amount needed per recipe
      const totalNeeded = deductQuantity * orderQuantity; // Total amount needed

      console.log(`Deducting ${ingredient.name}: need ${totalNeeded}${ingredient.unit}, current: stock=${ingredient.stock}, quantity=${ingredient.quantity}, original_quantity=${ingredient.original_quantity}`);

      // Calculate available quantity: current + (stock × original_quantity)
      const availableNow = ingredient.quantity + (ingredient.stock * ingredient.original_quantity);

      // Check if we have enough total available
      if (totalNeeded > availableNow) {
        throw new Error(
          `Insufficient total stock for ${ingredient.name}: Available: ${availableNow}${ingredient.unit}, Required: ${totalNeeded}${ingredient.unit}`
        );
      }

      let newStock = ingredient.stock;
      let newQuantity = ingredient.quantity;

      // If current quantity is sufficient
      if (totalNeeded <= ingredient.quantity) {
        newQuantity = ingredient.quantity - totalNeeded;
        console.log(`Using current opened unit: newStock=${newStock}, newQuantity=${newQuantity}`);
      } else {
        // Need to consume from stock units
        let remainingNeeded = totalNeeded - ingredient.quantity;

        // Current unit is fully consumed
        newQuantity = 0;

        // Calculate how many full units we need to consume
        const fullUnitsNeeded = Math.floor(remainingNeeded / ingredient.original_quantity);
        const partialUnitConsumption = remainingNeeded % ingredient.original_quantity;

        // Consume full units
        newStock = ingredient.stock - fullUnitsNeeded;

        // If there's partial consumption, consume one more unit partially
        if (partialUnitConsumption > 0) {
          newStock = newStock - 1;
          newQuantity = ingredient.original_quantity - partialUnitConsumption;
        }

        console.log(`Consumed ${ingredient.quantity} from current + ${fullUnitsNeeded} full units + ${partialUnitConsumption} from partial unit. newStock=${newStock}, newQuantity=${newQuantity}`);
      }

      // Ensure values don't go negative
      newStock = Math.max(0, newStock);
      newQuantity = Math.max(0, newQuantity);

      const { error: updateError } = await supabaseServerClient
        .from("ingredients")
        .update({ stock: newStock, quantity: newQuantity })
        .eq("id", ingredient.id);

      if (updateError) {
        throw updateError;
      }

      // Update associated product if exists
      if (ingredient.product_id) {
        await updateAssociatedProduct(ingredient.product_id, newStock, newQuantity);
      }
    }

    // Update the recipe product stock
    // await updateProductStock(productId, orderQuantity);

    return true;

  } catch (error) {
    throw error;
  }
}

async function deductRecipeIngredients(
  productId: string,
  orderQuantity: number,
  barId: number
): Promise<boolean> {
  return deductInventory(productId, orderQuantity, barId);
}

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    const baseQuery = supabaseServerClient
      .from("orders")
      .select(
        `
                *,
                order_items (
                    id,
                    product_id,
                    quantity,
                    unit_price,
                    products (
                        name,
                        image_url,
                        stock
                    )
                ),
                qr_codes (
                    id,
                    bar_id, name

                ),
                user:profiles!user_id (
                    id,
                    email,
                    name,
                    sector_id
                )
            `
      );

    let data, error;

    // If orderId is provided, fetch single order
    if (orderId) {
      const result = await baseQuery.eq('id', orderId).single();
      data = result.data;
      error = result.error;
    } else {
      // Otherwise fetch all orders
      const result = await baseQuery.neq("status", "paying").order("created_at", { ascending: false });
      data = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { data, error } = await supabaseServerClient
      .from("orders")
      .insert([
        {
          user_id: body.user_id,
          user_name: body.user_name,
          status: body.status,
          total_amount: body.total_amount,
          notes: body.notes,
          created_at: body.created_at,
          updated_at: body.updated_at,
          is_table_order: body.is_table_order,
          table_number: body.table_number,
          payment_method: body.payment_method,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }
    const { error: itemsError } = await supabaseServerClient
      .from("order_items")
      .insert(
        body.order_items.map((item: any) => ({ ...item, order_id: data.id }))
      );

    if (itemsError) {
      throw itemsError;
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PUT = async (req: Request) => {
  try {
    // Parse the request body
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    const { id, ...orderData } = body;
    if (orderData.order_items) {
      const orderItems = orderData.order_items;

      for (const item of orderItems) {
        if (item.id) {
          const { error } = await supabaseServerClient
            .from("order_items")
            .update(item)
            .eq("id", item.id);
          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabaseServerClient
            .from("order_items")
            .insert({
              quantity: item.quantity,
              unit_price: item.unit_price,
              product_id: item.product_id,
              order_id: id,
            });
          if (error) {
            throw error;
          }
        }
      }
    }

    if (orderData.status == "delivered") {
      const order = await supabaseServerClient
        .from("orders")
        .select(
          "*, user:profiles!user_id (balance), order_items (id, product_id, quantity, unit_price, products (stock, name)), qr: qr_codes!qr_id (id, bar_id)"
        )
        .eq("id", id)
        .single();

      const { data: user } = await supabaseServerClient
        .from("profiles")
        .select("*, qr: qr_codes!qr_id (id, bar_id)")
        .eq("id", order.data.user_id)
        .single();

      if (order.error) throw order.error;
      if (!order.data) throw new Error("Order not found");

      if (order.data.payment_method == "balance") {
        const { error: userError } = await supabaseServerClient
          .from("profiles")
          .update({
            balance: order.data.user.balance - order.data.total_amount,
          })
          .eq("id", order.data.user_id);

        if (userError) {
          throw new Error(
            `Failed to update user balance: ${userError.message}`
          );
        }
      }

      for (const item of order.data.order_items) {
        try {
          await deductRecipeIngredients(
            item.product_id,
            item.quantity,
            user?.qr?.bar_id
          );
        } catch (error) {
          throw error;
        }
      }
    }
    const { error } = await supabaseServerClient
      .from("orders")
      .update(orderData)
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json(orderData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const DELETE = async (req: Request) => {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServerClient
      .from("orders")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: "Order deleted successfully", data },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
