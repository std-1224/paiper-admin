import { NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from("adjust")
            .select("*, inventory(bar_id,bars(name, location), products(name, category))");
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
        const type = body.type;

        // Validate required fields
        if (!type || !["re-entry", "loss"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid or missing adjustment type" },
                { status: 400 }
            );
        }

        if (!body.quantity || body.quantity <= 0) {
            return NextResponse.json(
                { error: "Quantity must be greater than 0" },
                { status: 400 }
            );
        }

        if (type === "loss" && !body.reason?.trim()) {
            return NextResponse.json(
                { error: "Reason is required for loss adjustments" },
                { status: 400 }
            );
        }

        // Get inventory data if inventory_id is provided
        let inventoryData = null;
        if (body.inventory_id) {
            inventoryData = await supabaseServerClient
                .from("inventory")
                .select("*")
                .eq("id", body.inventory_id);

            if (!inventoryData.data || inventoryData.data.length === 0) {
                return NextResponse.json(
                    { error: "Inventory item not found" },
                    { status: 404 }
                );
            }
        }

        if (type === "re-entry") {
            if (body.inventory_id) {
                // Re-entry from existing inventory item
                const currentInventory = inventoryData?.data?.[0];
                if (!currentInventory) {
                    throw new Error("Inventory item not found");
                }

                // Validate we have enough quantity to re-enter
                if (currentInventory.quantity < body.quantity) {
                    throw new Error("Cannot re-enter more than available quantity");
                }

                // Reduce quantity from source inventory
                const { error: updateError } = await supabaseServerClient
                    .from("inventory")
                    .update({
                        quantity: currentInventory.quantity - body.quantity,
                    })
                    .eq("id", body.inventory_id);

                if (updateError) throw updateError;

                // Add to destination bar or general stock
                if (body.destinationBars && body.destinationBars.length > 0) {
                    // Re-enter to specific bar
                    const { data: destinationInventory } = await supabaseServerClient
                        .from("inventory")
                        .select("*")
                        .eq("product_id", currentInventory.product_id)
                        .eq("bar_id", body.destinationBars[0])
                        .single();

                    if (destinationInventory) {
                        // Update existing inventory
                        await supabaseServerClient
                            .from("inventory")
                            .update({
                                quantity: destinationInventory.quantity + body.quantity,
                            })
                            .eq("id", destinationInventory.id);
                    } else {
                        // Create new inventory entry
                        await supabaseServerClient
                            .from("inventory")
                            .insert({
                                product_id: currentInventory.product_id,
                                bar_id: body.destinationBars[0],
                                quantity: body.quantity,
                            });
                    }
                } else {
                    // Re-enter to general stock
                    const { data: product } = await supabaseServerClient
                        .from("products")
                        .select("stock")
                        .eq("id", currentInventory.product_id)
                        .single();

                    if (product) {
                        await supabaseServerClient
                            .from("products")
                            .update({
                                stock: product.stock + body.quantity,
                            })
                            .eq("id", currentInventory.product_id);
                    }
                }
            } else if (body.product) {
                // Re-entry from general stock to specific bar
                // First, check if we have enough stock in the general product
                const { data: product } = await supabaseServerClient
                    .from("products")
                    .select("stock")
                    .eq("id", body.product)
                    .single();

                if (!product) {
                    throw new Error("Product not found");
                }

                if (product.stock < body.quantity) {
                    throw new Error("Cannot re-enter more than available quantity in general stock");
                }

                // Deduct from general product stock
                await supabaseServerClient
                    .from("products")
                    .update({
                        stock: product.stock - body.quantity,
                    })
                    .eq("id", body.product);

                // Add to destination bar
                if (body.destinationBars && body.destinationBars.length > 0) {
                    // Re-enter to specific bar
                    const { data: destinationInventory } = await supabaseServerClient
                        .from("inventory")
                        .select("*")
                        .eq("product_id", body.product)
                        .eq("bar_id", body.destinationBars[0])
                        .single();

                    if (destinationInventory) {
                        // Update existing inventory
                        await supabaseServerClient
                            .from("inventory")
                            .update({
                                quantity: destinationInventory.quantity + body.quantity,
                            })
                            .eq("id", destinationInventory.id);
                    } else {
                        // Create new inventory entry
                        await supabaseServerClient
                            .from("inventory")
                            .insert({
                                product_id: body.product,
                                bar_id: body.destinationBars[0],
                                quantity: body.quantity,
                            });
                    }
                }
            }
        } else if (type === "loss") {
            // Handle stock loss
            if (body.inventory_id) {
                const currentInventory = inventoryData?.data?.[0];
                if (!currentInventory) {
                    throw new Error("Inventory item not found");
                }

                // Validate we have enough quantity to register as loss
                if (currentInventory.quantity < body.quantity) {
                    throw new Error("Cannot register loss for more than available quantity");
                }

                // Reduce quantity from inventory
                const { error: updateError } = await supabaseServerClient
                    .from("inventory")
                    .update({
                        quantity: currentInventory.quantity - body.quantity,
                    })
                    .eq("id", body.inventory_id);

                if (updateError) throw updateError;

                // Also reduce from general product stock to maintain consistency
                const { data: product } = await supabaseServerClient
                    .from("products")
                    .select("stock")
                    .eq("id", currentInventory.product_id)
                    .single();

                if (product && product.stock >= body.quantity) {
                    await supabaseServerClient
                        .from("products")
                        .update({
                            stock: product.stock - body.quantity,
                        })
                        .eq("id", currentInventory.product_id);
                }
            } else if (body.product) {
                // Direct loss from general stock
                const { data: product } = await supabaseServerClient
                    .from("products")
                    .select("stock")
                    .eq("id", body.product)
                    .single();

                if (!product) {
                    throw new Error("Product not found");
                }

                if (product.stock < body.quantity) {
                    throw new Error("Cannot register loss for more than available quantity");
                }

                // Reduce from general product stock
                await supabaseServerClient
                    .from("products")
                    .update({
                        stock: product.stock - body.quantity,
                    })
                    .eq("id", body.product);
            }
        }

        const { data, error } = await supabaseServerClient
            .from("adjust")
            .insert([
                {
                    inventory_id: body.inventory_id || null,
                    amount: body.quantity,
                    description: body?.observations,
                    type: body.type,
                    reason: body.reason,
                    is_opened: body.isOpened,
                    destination_bar: type === "re-entry" ? (body.destinationBars?.[0] || null) : (inventoryData?.data?.[0]?.bar_id || null),
                },
            ]);
        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error("Error creating adjust:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export const PUT = async (req: Request) => {
    try {
        // Parse the request body
        const body = await req.json();
        const { id, ...updateData } = body;
        if (!body.id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }
        const { data, error } = await supabaseServerClient
            .from("adjust")
            .update({
                address: updateData.address,
                phone: updateData.phone,
                name: updateData.name,
                role: updateData.role,
                status: updateData.status,
            })
            .eq("id", id);

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 }); // Return the updated user
    } catch (error: any) {
        console.error("Error updating user:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export const DELETE = async (req: Request) => {
    try {
        // Parse the request body
        const body = await req.json();
        const { id, clearAll } = body;

        if (clearAll) {
            // Clear all adjustment records
            const { data, error } = await supabaseServerClient
                .from("adjust")
                .delete()
                .neq("id", 0); // Delete all records

            if (error) {
                throw error;
            }

            return NextResponse.json(
                { message: "All adjustment records cleared successfully", data },
                { status: 200 }
            );
        }

        // Validate that the `id` is provided for single deletion
        if (!id) {
            return NextResponse.json(
                { error: "Adjustment ID is required" },
                { status: 400 }
            );
        }

        // Delete single adjustment record
        const { data, error } = await supabaseServerClient
            .from("adjust")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        return NextResponse.json(
            { message: "Adjustment deleted successfully", data },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting adjustment:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};
