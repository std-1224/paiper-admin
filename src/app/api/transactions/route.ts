import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from('transactions')
            .select(`
                *,
                user:profiles!user_id (
                    id,
                    email,
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching transactions:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const {
            user_id,
            amount,
            type = 'cash',
            status = 'approved',
            payment_url = null,
            preference_id = null,
            order_id = null
        } = body;

        if (!user_id || amount === undefined || amount === null) {
            return NextResponse.json(
                { error: 'user_id and amount are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseServerClient
            .from('transactions')
            .insert([
                {
                    user_id,
                    amount, // Can be positive or negative
                    type,
                    status,
                    payment_url,
                    preference_id,
                    order_id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('Error creating transaction:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};
