import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

export const POST = async (req: Request) => {
    try {
        // Parse the request body
        const body = await req.json();
        const { chargeAmount, userId } = body;
        if (!chargeAmount || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { data: transaction, error: transactionError } = await supabaseServerClient
            .from("transactions")
            .insert([
                {
                    user_id: userId,
                    amount: chargeAmount,
                    type: "cash",
                    status: "approved",
                },
            ])
            .select()
            .single();

        const { data: user, error: fetchError } = await supabaseServerClient
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        const { data: userUpdate, error: userError } = await supabaseServerClient.from("profiles").update({
            balance: user?.balance + Number(chargeAmount),
        })
            .eq("id", userId)
            .select()
            .single();

        return NextResponse.json(userUpdate, { status: 200 });
    } catch (error: any) {
        console.error('Error updating user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};