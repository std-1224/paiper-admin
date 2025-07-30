import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';


export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        console.log("type: ", type)

        let query = supabaseServerClient
            .from("products")
            .select("*")
            .order("id", { ascending: true });

        // Filter by type if specified
        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching products:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const { data, error } = await supabaseServerClient
            .from('products')
            .insert([{
                name: body.name,
                description: body.description,
                category: body.category,
                stock: body.stock,
                image_url: body.image_url,
                purchase_price: body.purchase_price,
                sale_price: body.sale_price,
                type: body.type || 'product', // Default type is "product"
                has_recipe: body.has_recipe || false,
                ingredients: body.ingredients || null
            }])
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
        const {id, ...body} = await req.json();
        const { data, error } = await supabaseServerClient
            .from('products')
            .update(body)
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
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const res = await supabaseServerClient.from('order_items').delete().eq('product_id', id);
        const invRes = await supabaseServerClient.from('inventory').delete().eq('product_id', id);

        if (res.error || invRes.error) {
            throw res.error || invRes.error;
        }

        // Delete the user from the 'profiles' table
        const { data, error } = await supabaseServerClient
            .from('products') // Replace 'profiles' with your actual table name
            .delete()
            .eq('id', id); // Match the user by ID

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: 'Product deleted successfully', data }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting product:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};