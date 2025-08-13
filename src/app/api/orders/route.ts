import { NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

async function deductProductIngredients(
  productId: string,
  orderQuantity: number,
  barId: number
) {
  try {
    const { data: product, error: productError } = await supabaseServerClient
      .from("products")
      .select("id, name, type, stock, has_recipe")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return false;
    }

    if (!product.has_recipe) {
      return false;
    }

    const { data: recipeIngredients, error: recipeError } =
      await supabaseServerClient
        .from("recipe_ingredients")
        .select(
          `
        id,
        recipe_id,
        deduct_quantity,
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
      `
        )
        .eq("product_id", productId);

    if (recipeError) {
      return false;
    }

    if (!recipeIngredients || recipeIngredients.length === 0) {
      return false;
    }

    for (const recipeIngredient of recipeIngredients) {
      const { data: ingredientData, error: ingredientError } = await supabaseServerClient
        .from("ingredients")
        .select("id, name, stock, quantity, product_id")
        .eq("id", recipeIngredient.ingredient_id)
        .single();

      if (ingredientError || !ingredientData) {
        continue;
      }

      // Validate sufficient stock and quantity in ingredients
      if (ingredientData.stock < recipeIngredient.deduct_stock) {
        throw new Error(
          `Insufficient ingredient stock for: ${ingredientData.name}. Available: ${ingredientData.stock}, Required: ${recipeIngredient.deduct_stock}`
        );
      }

      if (ingredientData.quantity < recipeIngredient.deduct_quantity) {
        throw new Error(
          `Insufficient ingredient quantity for: ${ingredientData.name}. Available: ${ingredientData.quantity}, Required: ${recipeIngredient.deduct_quantity}`
        );
      }

      // Validate sufficient deduct amounts in recipe_ingredients
      if (recipeIngredient.deduct_stock < 0) {
        throw new Error(
          `Invalid recipe ingredient stock for: ${ingredientData.name}. Current deduct_stock: ${recipeIngredient.deduct_stock}`
        );
      }

      if (recipeIngredient.deduct_quantity < 0) {
        throw new Error(
          `Invalid recipe ingredient quantity for: ${ingredientData.name}. Current deduct_quantity: ${recipeIngredient.deduct_quantity}`
        );
      }

      // 1. Deduct from real ingredients
      const { error: ingredientUpdateError } = await supabaseServerClient
        .from("ingredients")
        .update({
          stock: ingredientData.stock - recipeIngredient.deduct_stock,
          quantity: ingredientData.quantity - recipeIngredient.deduct_quantity,
        })
        .eq("id", recipeIngredient.ingredient_id);

      if (ingredientUpdateError) {
        throw ingredientUpdateError;
      }

      // 2. Deduct from recipe_ingredients table (the current recipeIngredient is from the product)
      // We need to deduct from the base recipe's recipe_ingredients
      if (recipeIngredient.recipe_id) {
        // Find the base recipe ingredient (where product_id is null)
        const { data: baseRecipeIngredient, error: baseRecipeError } = await supabaseServerClient
          .from("recipe_ingredients")
          .select("id, deduct_stock, deduct_quantity")
          .eq("recipe_id", recipeIngredient.recipe_id)
          .eq("ingredient_id", recipeIngredient.ingredient_id)
          .is("product_id", null)
          .single();

        if (baseRecipeIngredient && !baseRecipeError) {
          // Deduct from base recipe ingredients using the product's deduct values
          const { error: baseRecipeUpdateError } = await supabaseServerClient
            .from("recipe_ingredients")
            .update({
              deduct_stock: baseRecipeIngredient.deduct_stock - recipeIngredient.deduct_stock,
              deduct_quantity: baseRecipeIngredient.deduct_quantity - recipeIngredient.deduct_quantity,
            })
            .eq("id", baseRecipeIngredient.id);

          if (baseRecipeUpdateError) {
            throw baseRecipeUpdateError;
          }
        }
      }

      // 3. If ingredient has product_id (ingredient-product), also deduct from products table
      if (ingredientData.product_id) {
        const { data: ingredientProductData, error: ingredientProductError } = await supabaseServerClient
          .from("products")
          .select("id, name, stock, quantity")
          .eq("id", ingredientData.product_id)
          .single();

        if (ingredientProductData && !ingredientProductError) {
          // Validate sufficient stock in ingredient-product
          if (ingredientProductData.stock < recipeIngredient.deduct_stock) {
            throw new Error(
              `Insufficient ingredient-product stock for: ${ingredientProductData.name}. Available: ${ingredientProductData.stock}, Required: ${recipeIngredient.deduct_stock}`
            );
          }

          // Deduct from ingredient-product
          const { error: ingredientProductUpdateError } = await supabaseServerClient
            .from("products")
            .update({
              stock: ingredientProductData.stock - recipeIngredient.deduct_stock,
              quantity: ingredientProductData.quantity ? ingredientProductData.quantity - recipeIngredient.deduct_quantity : null,
            })
            .eq("id", ingredientData.product_id);

          if (ingredientProductUpdateError) {
            throw ingredientProductUpdateError;
          }
        }
      }
    }

    const { data: productData, error: productFetchError } = await supabaseServerClient
      .from("products")
      .select("stock, name")
      .eq("id", productId)
      .single();

    if (productFetchError || !productData) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Validate sufficient stock in the main product
    if (productData.stock < orderQuantity) {
      throw new Error(
        `Insufficient product stock for: ${productData.name}. Available: ${productData.stock}, Required: ${orderQuantity}`
      );
    }

    const { error: productUpdateError } = await supabaseServerClient
      .from("products")
      .update({
        stock: productData.stock - orderQuantity,
      })
      .eq("id", productId);

    if (productUpdateError) {
      throw productUpdateError;
    }

    return true;
  } catch (error) {
    throw error;
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
          const recipeProcessed = await deductProductIngredients(
            item.product_id,
            item.quantity,
            user?.qr?.bar_id
          );

          if (!recipeProcessed) {
            if (item.amount !== undefined) {
              const { data: productData, error: productFetchError } =
                await supabaseServerClient
                  .from("products")
                  .select("stock, quantity")
                  .eq("id", item.product_id)
                  .single();

              if (productFetchError || !productData) {
                throw new Error(`Product not found: ${item.product_id}`);
              }

              // Validate sufficient stock and quantity in products table
              if (productData.stock < item.quantity) {
                throw new Error(
                  `Insufficient product stock for: ${item.products.name}. Available: ${productData.stock}, Required: ${item.quantity}`
                );
              }

              if (productData.quantity && productData.quantity < item.amount) {
                throw new Error(
                  `Insufficient product quantity for: ${item.products.name}. Available: ${productData.quantity}, Required: ${item.amount}`
                );
              }

              const productUpdateData: any = {
                stock: productData.stock - item.quantity,
              };

              if (
                productData.quantity !== undefined &&
                productData.quantity !== null
              ) {
                productUpdateData.quantity = productData.quantity - item.amount;
              }

              const { error: productUpdateError } = await supabaseServerClient
                .from("products")
                .update(productUpdateData)
                .eq("id", item.product_id);

              if (productUpdateError) throw productUpdateError;

              const { data: ingredientData } = await supabaseServerClient
                .from("ingredients")
                .select("id, stock, quantity")
                .eq("product_id", item.product_id)
                .single();

              if (ingredientData) {
                // Validate sufficient stock and quantity in ingredients table
                if (ingredientData.stock < item.quantity) {
                  throw new Error(
                    `Insufficient ingredient stock for: ${item.products.name}. Available: ${ingredientData.stock}, Required: ${item.quantity}`
                  );
                }

                if (ingredientData.quantity < item.amount) {
                  throw new Error(
                    `Insufficient ingredient quantity for: ${item.products.name}. Available: ${ingredientData.quantity}, Required: ${item.amount}`
                  );
                }

                const { error: ingredientUpdateError } =
                  await supabaseServerClient
                    .from("ingredients")
                    .update({
                      stock: ingredientData.stock - item.quantity,
                      quantity: ingredientData.quantity - item.amount,
                    })
                    .eq("id", ingredientData.id);

                if (ingredientUpdateError) throw ingredientUpdateError;
              }
            } else {
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
