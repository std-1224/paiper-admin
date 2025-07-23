import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

export const GET = async (req: Request, { params }: { params: { 'bar-id': string } }) => {
    try {
        const barId = params['bar-id']; // Get the bar-id from the URL

        const { data, error } = await supabaseServerClient
            .from("staff")
            .select("*, user:profiles!user_id(email, name), bar:bars!bar_id(name)")
            .eq("bar_id", barId); // Filter inventory by bar-id

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching staff:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};