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
