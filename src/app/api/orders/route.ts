import { NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

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
        const { data: inventory } = await supabaseServerClient
          .from("inventory")
          .select("*")
          .eq("product_id", item.product_id)
          .eq("bar_id", user?.qr?.bar_id)
          .single();
        console.log("Inventory:", inventory);
        if (inventory && inventory.quantity > item.quantity) {
          // if (inventory.quantity < item.quantity) {
          //     throw new Error("Not enough stock in inventory");
          // }
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
          // if (item.products.stock < item.quantity) {
          //     throw new Error("Not enough stock");
          // }
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

    return NextResponse.json(orderData, { status: 200 }); // Return the updated user
  } catch (error: any) {
    console.error("Error updating order:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const DELETE = async (req: Request) => {
  try {
    // Parse the request body
    const body = await req.json();
    const { id } = body;

    // Validate that the `id` is provided
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Delete the user from the 'profiles' table
    const { data, error } = await supabaseServerClient
      .from("orders") // Replace 'profiles' with your actual table name
      .delete()
      .eq("id", id); // Match the user by ID

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
