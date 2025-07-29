import { NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from("transfer")
            .select("*, inventory(products(name, category)), from_bar_details:bars!from_bar(name), to_bar_details:bars!to_bar(name)");
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
        console.log("Transfer request body:", body);

        const transfers = [];

        // Handle transfers to multiple destinations
        const destinationBars = Array.isArray(body.to_id) ? body.to_id : [body.to_id];

        // First, create transfer records
        for (let i = 0; i < body.inventory_id.length; i++) {
            const inventoryId = body.inventory_id[i];
            const fromBarId = body.from_id[i];
            const quantity = body.quantity[i];

            // Create a transfer record for each destination bar
            for (const destinationBar of destinationBars) {
                transfers.push({
                    from_bar: fromBarId,
                    to_bar: destinationBar === "general-stock" ? null : destinationBar,
                    amount: quantity,
                    inventory_id: inventoryId
                });
            }
        }

        console.log("Transfers to be inserted:", transfers);

        // Insert transfer records
        const { data: transferData, error: transferError } = await supabaseServerClient
            .from("transfer")
            .insert(transfers);

        if (transferError) {
            throw transferError;
        }

        // Now update inventory quantities
        for (let i = 0; i < body.inventory_id.length; i++) {
            const inventoryId = body.inventory_id[i];
            const fromBarId = body.from_id[i];
            const quantity = body.quantity[i];

            // Get current inventory item
            const { data: currentInventory, error: fetchError } = await supabaseServerClient
                .from("inventory")
                .select("*")
                .eq("id", inventoryId)
                .single();

            if (fetchError) {
                console.error("Error fetching inventory:", fetchError);
                continue;
            }

            // Reduce quantity from source bar
            const newQuantity = Math.max(0, currentInventory.quantity - quantity);
            const { error: updateError } = await supabaseServerClient
                .from("inventory")
                .update({ quantity: newQuantity })
                .eq("id", inventoryId);

            if (updateError) {
                console.error("Error updating source inventory:", updateError);
                continue;
            }

            // Add quantity to destination bars
            for (const destinationBar of destinationBars) {
                if (destinationBar === "general-stock") {
                    // For general stock, we might need to handle differently
                    // For now, we'll just create the transfer record
                    continue;
                }

                // Check if inventory item exists in destination bar
                const { data: destInventory, error: destFetchError } = await supabaseServerClient
                    .from("inventory")
                    .select("*")
                    .eq("bar_id", destinationBar)
                    .eq("product_id", currentInventory.product_id)
                    .single();

                if (destFetchError && destFetchError.code !== 'PGRST116') {
                    console.error("Error fetching destination inventory:", destFetchError);
                    continue;
                }

                if (destInventory) {
                    // Update existing inventory
                    const { error: destUpdateError } = await supabaseServerClient
                        .from("inventory")
                        .update({ quantity: destInventory.quantity + quantity })
                        .eq("id", destInventory.id);

                    if (destUpdateError) {
                        console.error("Error updating destination inventory:", destUpdateError);
                    }
                } else {
                    // Create new inventory item in destination bar
                    const { error: destCreateError } = await supabaseServerClient
                        .from("inventory")
                        .insert({
                            bar_id: destinationBar,
                            product_id: currentInventory.product_id,
                            quantity: quantity,
                            status: "En Stock"
                        });

                    if (destCreateError) {
                        console.error("Error creating destination inventory:", destCreateError);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, transfers: transferData }, { status: 200 });
    } catch (error: any) {
        console.error("Error creating transfer:", error.message);
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
            // Clear all transfer records
            const { data, error } = await supabaseServerClient
                .from("transfer")
                .delete()
                .neq("id", 0); // Delete all records

            if (error) {
                throw error;
            }

            return NextResponse.json(
                { message: "All transfer records cleared successfully", data },
                { status: 200 }
            );
        }

        // Validate that the `id` is provided for single deletion
        if (!id) {
            return NextResponse.json(
                { error: "Transfer ID is required" },
                { status: 400 }
            );
        }

        // Delete single transfer record
        const { data, error } = await supabaseServerClient
            .from("transfer")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        return NextResponse.json(
            { message: "Transfer deleted successfully", data },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting transfer:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};
