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
        const transfers = body.inventory_id.map((id: number, index: number) => ({
            from_bar: body.from_id[index],
            to_bar: body.to_id,
            amount: body.quantity[index],
            inventory_id: id
        }));
        console.log("Transfers to be inserted:", transfers);
        const { data, error } = await supabaseServerClient
            .from("transfer")
            .insert(transfers);
        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error("Error creating user:", error.message);
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
