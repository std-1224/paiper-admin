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
        // if(body.inventory_id) {

        // }
        const inventoryData = await supabaseServerClient
            .from("inventory")
            .select("*")
            .eq("id", body.inventory_id);

        if (type === "re-entry") {
            if (body.inventory_id) {

                const updateInventory = await supabaseServerClient
                    .from("inventory")
                    .update({
                        quantity: inventoryData?.data?.[0].quantity - body.quantity,
                    })
                    .eq("id", body.inventory_id);

                const adjustedInventory = await supabaseServerClient
                    .from("inventory")
                    .select("*")
                    .eq("product_id", inventoryData?.data?.[0].product_id)
                    .eq("bar_id", body.destinationBars[0]);

                if ((adjustedInventory?.data?.length || 0) > 0) {
                    const updateAdjustedInventory = await supabaseServerClient
                        .from("inventory")
                        .update({
                            quantity: adjustedInventory?.data?.[0].quantity + body.quantity,
                        })
                        .eq("id", adjustedInventory?.data?.[0].id);
                } else {
                    const insertAdjustedInventory = await supabaseServerClient
                        .from("inventory")
                        .insert({
                            product_id: inventoryData?.data?.[0].product_id,
                            bar_id: body.destinationBars[0],
                            quantity: body.quantity,
                        });
                }
            } else {
                const insertAdjustedInventory = await supabaseServerClient
                    .from("inventory")
                    .insert({
                        product_id: body.product,
                        bar_id: body.destinationBars[0],
                        quantity: body.quantity,
                        unit: body.associatedCost,
                    });
            }
        } else if (type === "loss") {
            console.log(inventoryData)
            const updateInventory = await supabaseServerClient
                .from("inventory")
                .update({
                    quantity: inventoryData?.data?.[0].quantity - body.quantity,
                })
                .eq("id", body.inventory_id);
        }

        const { data, error } = await supabaseServerClient
            .from("adjust")
            .insert([
                {
                    inventory_id: body.inventory_id,
                    amount: body.quantity,
                    description: body?.observations,
                    type: body.type,
                    reason: body.reason,
                    associated_cost: body.associatedCost,
                    economic_value: body.economicValue,
                    is_opened: body.isOpened,
                    destination_bar: type === "re-entry" ? body.destinationBars[0] : inventoryData?.data?.[0].bar_id,
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
        const { id } = body;

        // Validate that the `id` is provided
        if (!id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Delete the user from the 'profiles' table
        const { data, error } = await supabaseServerClient
            .from("adjust") // Replace 'profiles' with your actual table name
            .delete()
            .eq("id", id); // Match the user by ID

        if (error) {
            throw error;
        }

        return NextResponse.json(
            { message: "User deleted successfully", data },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting user:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};
