import { NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from("staff")
            .select("*, user:profiles!user_id(email, name), bar:bars!bar_id(name)");
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
            .from("staff")
            .insert([
                {
                    user_id: body.userId,
                    bar_id: body.assignedBar,
                    role: body.role,
                },
            ]);
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
            .from("staff")
            .update({
                user_id: updateData.userId,
                bar_id: updateData.barId,
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
            .from("staff") // Replace 'profiles' with your actual table name
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
