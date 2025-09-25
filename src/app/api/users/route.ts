import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';


export const GET = async (req: NextRequest) => {
    try {
        const { searchParams } = req.nextUrl;
        const userId = searchParams.get('userId');
        if (userId) {
            const { data, error } = await supabaseServerClient
                .from('profiles')
                .select('*').eq('id', userId).single();
            if (error) {
                throw error;
            }
            return NextResponse.json(data, { status: 200 });
        } else {

            const { data, error } = await supabaseServerClient
                .from('profiles')
                .select('*');
            if (error) {
                throw error;
            }
            return NextResponse.json(data, { status: 200 });
        }

    } catch (error: any) {
        console.error('Error fetching users:', error.message);
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

        // Get the original user data to check for balance changes
        const { data: originalUser, error: fetchError } = await supabaseServerClient
            .from('profiles')
            .select('balance')
            .eq('id', id)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        // Update the user
        const { data, error } = await supabaseServerClient
            .from('profiles')
            .update({
                address: updateData.address,
                phone: updateData.phone,
                name: updateData.name,
                role: updateData.role,
                status: updateData.status,
                approval_status: updateData.approval_status,
                sector_id: updateData.sector_id,
                balance: updateData.balance,
                table_id: updateData.table_id
            })
            .eq('id', id);

        if (error) {
            throw error;
        }

        // Check if balance was updated and create transaction record
        const originalBalance = parseFloat(originalUser?.balance || '0');
        const newBalance = parseFloat(updateData.balance || '0');

        if (originalBalance !== newBalance) {
            const balanceChange = newBalance - originalBalance;

            try {
                await supabaseServerClient
                    .from('transactions')
                    .insert([
                        {
                            user_id: id,
                            amount: balanceChange, // Store the actual change (positive or negative)
                            type: 'cash',
                            status: 'approved',
                            payment_url: null,
                            preference_id: null,
                            order_id: null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    ]);
            } catch (transactionError) {
                console.error('Error creating transaction record:', transactionError);
                // Don't fail the user update if transaction creation fails
            }
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
            .from('profiles') // Replace 'profiles' with your actual table name
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