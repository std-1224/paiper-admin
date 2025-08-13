import { NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";
// Helper function to deduct ingredients based on the new schema
async function deductProductIngredients(productId: string, orderQuantity: number, orderAmount: number, barId: number) {
  try {
    // Get the product to check its type
    const { data: product, error: productError } = await supabaseServerClient
      .from("products")
      .select("id, name, type, stock, has_recipe")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return false;
    }

    // Check if this product has recipe ingredients in the recipe_ingredients table
    const { data: recipeIngredients, error: recipeError } = await supabaseServerClient
      .from("recipe_ingredients")
      .select(`
        id,
        recipe_id,
        deduct_amount,
        deduct_stock,
        ingredient_id,
        ingredients (
          id,
          name,
          stock,
          quantity,
          is_liquid,
          product_id
        )
      `)
      .eq("product_id", productId);

    if (recipeError) {
      return false;
    }

    if (!recipeIngredients || recipeIngredients.length === 0) {
      return false; // No recipe ingredients, use regular stock deduction
    }

    // Process each recipe ingredient
    for (const recipeIngredient of recipeIngredients) {
      const ingredient = recipeIngredient.ingredients as any;

      // Check if ingredient does NOT have product_id (as per your requirement)
      if (!ingredient.product_id) {
        // DEDUCTION SYSTEM - only subtraction (-): deduct_stock - quantity, deduct_amount - amount
        const newDeductStock = recipeIngredient.deduct_stock - orderQuantity;   // deduct_stock - quantity
        const newDeductAmount = recipeIngredient.deduct_amount - orderAmount;   // deduct_amount - amount

        // 1. Update recipe_ingredients table
        await supabaseServerClient
          .from("recipe_ingredients")
          .update({
            deduct_stock: newDeductStock,
            deduct_amount: newDeductAmount,
          })
          .eq("id", recipeIngredient.id);

        // 2. ALSO deduct from ingredients table by ingredient_id
        const { data: ingredientData } = await supabaseServerClient
          .from("ingredients")
          .select("stock, quantity")
          .eq("id", recipeIngredient.ingredient_id)
          .single();

        if (ingredientData) {
          await supabaseServerClient
            .from("ingredients")
            .update({
              stock: ingredientData.stock - orderQuantity,     // stock - quantity
              quantity: ingredientData.quantity - orderAmount, // quantity - amount
            })
            .eq("id", recipeIngredient.ingredient_id);
        }
      }
    }

    // Find unique recipe_ids from the recipe ingredients
    const recipeIds = Array.from(new Set(recipeIngredients.map(ri => ri.recipe_id).filter(Boolean)));

    // Deduct from recipes table for each recipe
    for (const recipeId of recipeIds) {
      const { data: recipe } = await supabaseServerClient
        .from("recipes")
        .select("stock, quantity")
        .eq("id", recipeId)
        .single();

      if (recipe) {
        // DEDUCTION SYSTEM: Only subtraction (-), no addition (+) or multiplication (*)
        // Simply use orderAmount for deduction, no complex calculations
        const amountToDeduct = orderAmount;

        // Validate sufficient amounts in recipe
        if (recipe.stock < orderQuantity) {
          throw new Error(`Insufficient recipe stock. Available: ${recipe.stock}, Required: ${orderQuantity}`);
        }
        if (recipe.quantity < amountToDeduct) {
          throw new Error(`Insufficient recipe quantity. Available: ${recipe.quantity}, Required: ${amountToDeduct}`);
        }

        // Update recipes table: DEDUCTION SYSTEM - only subtraction (-)
        await supabaseServerClient
          .from("recipes")
          .update({
            stock: recipe.stock - orderQuantity,        // stock - quantity
            quantity: recipe.quantity - amountToDeduct, // quantity - amount
          })
          .eq("id", recipeId);
      }
    }

    // STEP 3: ALSO deduct from the main product that has recipe ingredients
    // This ensures both the ingredients AND the final product stock are reduced
    const { data: productData } = await supabaseServerClient
      .from("products")
      .select("stock, quantity, name")
      .eq("id", productId)
      .single();

    if (productData) {
      // Validate sufficient stock in the main product
      if (productData.stock < orderQuantity) {
        throw new Error(`Insufficient product stock for: ${productData.name}. Available: ${productData.stock}, Required: ${orderQuantity}`);
      }

      if (productData.quantity && productData.quantity < orderAmount) {
        throw new Error(`Insufficient product quantity for: ${productData.name}. Available: ${productData.quantity}, Required: ${orderAmount}`);
      }

      // DEDUCTION SYSTEM: Only subtraction (-) - stock - quantity, quantity - amount
      const productUpdateData: any = {
        stock: productData.stock - orderQuantity, // stock - quantity
      };

      if (productData.quantity !== undefined && productData.quantity !== null) {
        productUpdateData.quantity = productData.quantity - orderAmount; // quantity - amount
      }

      await supabaseServerClient
        .from("products")
        .update(productUpdateData)
        .eq("id", productId);
    }

    return true; // Recipe ingredients were processed successfully
  } catch (error) {
    throw error; // Re-throw to prevent order completion
  }
}

export const GET = async () => {
  try {
    const { data, error } = await supabaseServerClient
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
                    sector_id
                )
            `
      )
      .order("created_at", { ascending: false });
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
    console.log("body: ", body);
    const { id, ...orderData } = body;
    if (orderData.order_items) {
      const orderItems = orderData.order_items;

      // Fix: Use for...of loop instead of map() for proper async/await
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

        // Fix: Add error handling for balance update
        if (userError) {
          throw new Error(`Failed to update user balance: ${userError.message}`);
        }
      }

      for (const item of order.data.order_items) {
        try {
          // Try the new recipe ingredients deduction system first
          const recipeProcessed = await deductProductIngredients(
            item.product_id,
            item.quantity,
            item.amount || 0, // Use order amount if provided, otherwise 0
            user?.qr?.bar_id
          );

          // If no recipe ingredients were processed, use regular stock deduction
          if (!recipeProcessed) {
            // Check if this is an ingredient product (has amount field)
            if (item.amount !== undefined) {
              // STEP 1: Find and update product using product_id
              const { data: productData, error: productFetchError } = await supabaseServerClient
                .from("products")
                .select("stock, quantity")
                .eq("id", item.product_id)
                .single();

              if (productFetchError || !productData) {
                throw new Error(`Product not found: ${item.product_id}`);
              }

              // Validate sufficient stock and quantity in products table
              if (productData.stock < item.quantity) {
                throw new Error(`Insufficient product stock for: ${item.products.name}. Available: ${productData.stock}, Required: ${item.quantity}`);
              }

              if (productData.quantity && productData.quantity < item.amount) {
                throw new Error(`Insufficient product quantity for: ${item.products.name}. Available: ${productData.quantity}, Required: ${item.amount}`);
              }

              // DEDUCTION SYSTEM: Only subtraction (-) - stock - quantity, quantity - amount
              const productUpdateData: any = {
                stock: productData.stock - item.quantity, // stock - quantity
              };

              if (productData.quantity !== undefined && productData.quantity !== null) {
                productUpdateData.quantity = productData.quantity - item.amount; // quantity - amount
              }

              const { error: productUpdateError } = await supabaseServerClient
                .from("products")
                .update(productUpdateData)
                .eq("id", item.product_id);

              if (productUpdateError) throw productUpdateError;

              // STEP 2: Find and update ingredient using product_id
              const { data: ingredientData } = await supabaseServerClient
                .from("ingredients")
                .select("id, stock, quantity")
                .eq("product_id", item.product_id)
                .single();

              if (ingredientData) {
                // Validate sufficient stock and quantity in ingredients table
                if (ingredientData.stock < item.quantity) {
                  throw new Error(`Insufficient ingredient stock for: ${item.products.name}. Available: ${ingredientData.stock}, Required: ${item.quantity}`);
                }

                if (ingredientData.quantity < item.amount) {
                  throw new Error(`Insufficient ingredient quantity for: ${item.products.name}. Available: ${ingredientData.quantity}, Required: ${item.amount}`);
                }

                // DEDUCTION SYSTEM: Only subtraction (-) - stock - quantity, quantity - amount
                const { error: ingredientUpdateError } = await supabaseServerClient
                  .from("ingredients")
                  .update({
                    stock: ingredientData.stock - item.quantity,  // stock - quantity
                    quantity: ingredientData.quantity - item.amount, // quantity - amount
                  })
                  .eq("id", ingredientData.id);

                if (ingredientUpdateError) throw ingredientUpdateError;
              }
            } else {
              // Regular product deduction (stock only)
              // Try to deduct from inventory first (bar-specific)
              const { data: inventory } = await supabaseServerClient
                .from("inventory")
                .select("*")
                .eq("product_id", item.product_id)
                .eq("bar_id", user?.qr?.bar_id)
                .single();

              if (inventory && inventory.quantity >= item.quantity) {
                const { error: inventoryError } = await supabaseServerClient
                  .from("inventory")
                  .update({
                    quantity: inventory.quantity - item.quantity,
                  })
                  .eq("product_id", item.product_id)
                  .eq("bar_id", user?.qr?.bar_id);
                if (inventoryError) throw inventoryError;
              } else {
                // Deduct from product stock only
                const { error: productError } = await supabaseServerClient
                  .from("products")
                  .update({
                    stock: item.products.stock - item.quantity,
                  })
                  .eq("id", item.product_id);
                if (productError) throw productError;
              }
            }
          }
        } catch (error) {
          throw error; // Re-throw to prevent order completion
        }
      }
    } else {
      const { error } = await supabaseServerClient
        .from("orders")
        .update(orderData)
        .eq("id", id);
      if (error) throw error;
    }

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












