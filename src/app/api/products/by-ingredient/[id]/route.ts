import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

export const GET = async (req: Request, { params }: { params: { id: string } }) => {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 });
        }

        const { data, error } = await supabaseServerClient
            .from("products")
            .select("*")
            .eq('ingredient_id', id)
            .is('deleted_at', null)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No product found for this ingredient
                return NextResponse.json(null, { status: 200 });
            }
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching product by ingredient ID:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};
