import { NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

// Helper function to deduct recipe ingredients from stock
async function deductRecipeIngredients(productId: string, quantity: number, barId: number) {
  try {
    // Get the product with its recipe ingredients (stored as JSON in the ingredients field)
    const { data: product, error: productError } = await supabaseServerClient
      .from("products")
      .select("ingredients, has_recipe")
      .eq("id", productId)
      .single();

    if (productError || !product || !product.has_recipe || !product.ingredients) {
      return false; // No recipe, use regular stock deduction
    }

    // Parse the ingredients JSON
    let recipeIngredients;
    try {
      recipeIngredients = JSON.parse(product.ingredients);
    } catch (parseError) {
      console.error("Error parsing recipe ingredients JSON:", parseError);
      return false;
    }

    if (!Array.isArray(recipeIngredients) || recipeIngredients.length === 0) {
      return false; // No valid ingredients, use regular stock deduction
    }

    // Deduct each ingredient from inventory/stock
    for (const ingredient of recipeIngredients) {
      const ingredientQuantity = parseFloat(ingredient.quantity) * quantity;
      let ingredientProductId = null;
      let ingredientProduct = null;

      // First, try to use the linked productId if available
      if (ingredient.productId) {
        const { data: linkedProduct, error: linkedError } = await supabaseServerClient
          .from("products")
          .select("id, name, stock")
          .eq("id", ingredient.productId)
          .single();

        if (!linkedError && linkedProduct) {
          ingredientProduct = linkedProduct;
          ingredientProductId = linkedProduct.id;
        }
      }

      // If no linked product found, fall back to name matching
      if (!ingredientProduct) {
        const { data: ingredientProducts, error: searchError } = await supabaseServerClient
          .from("products")
          .select("id, name, stock")
          .ilike("name", `%${ingredient.name}%`)
          .eq("has_recipe", false); // Only match non-recipe products

        if (searchError || !ingredientProducts || ingredientProducts.length === 0) {
          console.warn(`Ingredient product not found: ${ingredient.name}`);
          continue; // Skip this ingredient and continue with others
        }

        // Use the first matching product
        ingredientProduct = ingredientProducts[0];
        ingredientProductId = ingredientProduct.id;
      }

      // Try to find ingredient in inventory first (bar-specific stock)
      if (barId) {
        const { data: inventory } = await supabaseServerClient
          .from("inventory")
          .select("*")
          .eq("bar_id", barId)
          .eq("product_id", ingredientProductId)
          .single();

        if (inventory && inventory.quantity >= ingredientQuantity) {
          // Deduct from inventory
          await supabaseServerClient
            .from("inventory")
            .update({
              quantity: inventory.quantity - ingredientQuantity,
            })
            .eq("id", inventory.id);
          continue; // Successfully deducted from inventory, move to next ingredient
        }
      }

      // Deduct from general product stock
      if (ingredientProduct.stock >= ingredientQuantity) {
        await supabaseServerClient
          .from("products")
          .update({
            stock: ingredientProduct.stock - ingredientQuantity,
          })
          .eq("id", ingredientProductId);
      } else {
        console.warn(`Insufficient stock for ingredient: ${ingredient.name}. Available: ${ingredientProduct.stock}, Required: ${ingredientQuantity}`);
        // Throw error to prevent order completion if critical ingredient is missing
        throw new Error(`Insufficient stock for ingredient: ${ingredient.name}. Available: ${ingredientProduct.stock}, Required: ${ingredientQuantity}`);
      }
    }

    return true; // Recipe ingredients were processed
  } catch (error) {
    console.error("Error deducting recipe ingredients:", error);
    return false; // Fall back to regular stock deduction
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
    console.error("Error fetching users:", error.message);
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
    console.error("Error creating user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PUT = async (req: Request) => {
  console.log("PUT request received");
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

      orderItems.map(async (item: any) => {
        if (item.id) {
          const { data, error } = await supabaseServerClient
            .from("order_items")
            .update(item)
            .eq("id", item.id);
          if (error) {
            throw error;
          }
        } else {
          const { data, error } = await supabaseServerClient
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
      });
    }

    if (orderData.status == "delivered") {
      const order = await supabaseServerClient
        .from("orders")
        .select(
          "*, user:profiles!user_id (balance), order_items (id, product_id, quantity, unit_price, products (stock)), qr: qr_codes!qr_id (id, bar_id)"
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
        const { data: userUpdate, error: userError } =
          await supabaseServerClient
            .from("profiles")
            .update({
              balance: order.data.user.balance - order.data.total_amount,
            })
            .eq("id", order.data.user_id)
            .select()
            .single();
      }

      for (const item of order.data.order_items) {
        // Try recipe-based stock deduction first
        const recipeProcessed = await deductRecipeIngredients(
          item.product_id,
          item.quantity,
          user?.qr?.bar_id
        );

        // If no recipe was processed, use regular stock deduction
        if (!recipeProcessed) {
          const { data: inventory } = await supabaseServerClient
            .from("inventory")
            .select("*")
            .eq("product_id", item.product_id)
            .eq("bar_id", user?.qr?.bar_id)
            .single();

          if (inventory && inventory.quantity > item.quantity) {
            // Deduct from inventory
            const { data: inventoryUpdate, error: inventoryError } =
              await supabaseServerClient
                .from("inventory")
                .update({
                  quantity: inventory.quantity - item.quantity,
                })
                .eq("product_id", item.product_id)
                .eq("bar_id", user?.qr?.bar_id)
                .select()
                .single();
            if (inventoryError) throw inventoryError;
          } else {
            // Deduct from product stock
            const { data: productUpdate, error: productError } =
              await supabaseServerClient
                .from("products")
                .update({
                  stock: item.products.stock - item.quantity,
                })
                .eq("id", item.product_id)
                .select()
                .single();
            if (productError) throw productError;
          }
        }
      }
    }

    const { data, error } = await supabaseServerClient
      .from("orders")
      .update({
        status: orderData.status,
        total_amount: orderData.total_amount,
        payment_method: orderData.payment_method,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    const { data: updatedOrder } = await supabaseServerClient
      .from("orders")
      .select("*, user:profiles!user_id (email)")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(orderData, { status: 200 });
  } catch (error: any) {
    console.error("Error updating order:", error.message);
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
    console.error("Error deleting order:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};












