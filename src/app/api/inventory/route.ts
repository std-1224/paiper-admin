import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';


export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from("inventory")
            .select("*, products(category, name), bars(name)")
        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching users:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        const body = await req.json();

        const { data: savedProducts } = await supabaseServerClient
            .from('inventory')
            .select('*')
            .eq('product_id', body.productId);
        const updatedProducts = savedProducts?.filter((p) => body.destinationBars.includes(p.bar_id));
        const savedBars = savedProducts?.map((p) => p.bar_id);
        if (updatedProducts?.length) {
            const updatedQuantities = updatedProducts.map((p) => ({
                id: p.id,
                quantity: p.quantity + body.quantity
            }));
            const { data, error } = await supabaseServerClient
                .from('inventory')
                .upsert(updatedQuantities, { onConflict: 'id' })
                .select('*');

            const transfers = data?.map((p) => ({
                to_bar: p.bar_id,
                amount: p.quantity,
                inventory_id: p.id
            }));
            const transferData = await supabaseServerClient
                .from("transfer")
                .insert(transfers);
            if (error) {
                throw error;
            }
            return NextResponse.json(data, { status: 200 });
        }

        const products = body.destinationBars.filter((barId: number) => !savedBars?.includes(barId)).map((barId: number) => ({ product_id: body.productId, quantity: body.quantity, bar_id: barId }));
        const { data, error } = await supabaseServerClient
            .from('inventory')
            .insert(products)
            .select('*')
        const transfers = data?.map((p) => ({
            to_bar: p.bar_id,
            amount: p.quantity,
            inventory_id: p.id
        }));
        const transferData = await supabaseServerClient
            .from("transfer")
            .insert(transfers);
        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error creating user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};


export const PUT = async (req: Request) => {
    try {
        // Parse the request body
        const body = await req.json();
        const { id, ...updateData } = body;
        if (!body.id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        const { data, error } = await supabaseServerClient
            .from('inventory')
            .update({ address: updateData.address, phone: updateData.phone, name: updateData.name, role: updateData.role, status: updateData.status })
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 }); // Return the updated user
    } catch (error: any) {
        console.error('Error updating user:', error.message);
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
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Delete the user from the 'profiles' table
        const { data, error } = await supabaseServerClient
            .from('inventory') // Replace 'profiles' with your actual table name
            .delete()
            .eq('id', id); // Match the user by ID

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: 'User deleted successfully', data }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};