import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';


export const DELETE = async (req: Request) => {
    try {
        // Parse the request body
        const body = await req.json();
        const { id } = body;

        // Validate that the `id` is provided
        if (!id) {
            return NextResponse.json({ error: 'Order Item ID is required' }, { status: 400 });
        }

        // Delete the user from the 'profiles' table
        const { data, error } = await supabaseServerClient
            .from('order_items') // Replace 'profiles' with your actual table name
            .delete()
            .eq('id', id); // Match the user by ID

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: 'Order Item deleted successfully', data }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting Order Item:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};