import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';


export const GET = async (req: NextRequest) => {
    const { searchParams } = req.nextUrl;
    const qrId = searchParams.get('qrId');
    try {
        const { data, error } = await supabaseServerClient
            .from('orders')
            .select(
                `
                *,
                user:profiles!user_id(email, name),
                order_items:order_items!order_id(product_id, quantity, products:products!product_id(name, sale_price))
            `
            ).eq('qr_id', qrId).order('created_at', { ascending: false });
        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching users:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};