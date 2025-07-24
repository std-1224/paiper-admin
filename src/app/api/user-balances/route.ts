import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from('profiles')
            .select('id, email, name, balance')
            .not('balance', 'is', null);
        
        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching user balances:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};
