import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';
import { Notification } from '@/types/types';


export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from('notifications')
            .select(`*`).order('created_at', { ascending: false });
        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching users:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};


export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const { data, error } = await supabaseServerClient
            .from('notifications')
            .insert([{ title: body.title, message: body.message, created_at: body.created_at, reference_id: body.reference_id }])
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error creating notification:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};


export const PUT = async (req: Request) => {
    try {
        // Parse the request body
        const body = await req.json();
        if (!body.id) {
            // mark all as read
            const { data, error } = await supabaseServerClient
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);
            if (error) {
                throw error;
            }
            return NextResponse.json(data, { status: 200 });
        }
        const { data, error } = await supabaseServerClient
            .from('notifications')
            .update({ is_read: body.is_read })
            .eq('id', body.id);

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 }); // Return the updated user
    } catch (error: any) {
        console.error('Error updating notification:', error.message);
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
            return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
        }

        // Delete the user from the 'profiles' table
        const { data, error } = await supabaseServerClient
            .from('notifications')
            .delete()
            .eq('id', id); // Match the user by ID

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: 'Notification deleted successfully', data }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting notification:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};
