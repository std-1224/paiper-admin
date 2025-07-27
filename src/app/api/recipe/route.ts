import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';


export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from('products')
            .select('*')
            .eq('has_recipe', true);
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
        const { name, ingredients, amount, category } = body;
        
        if (!name || !ingredients) {
            return NextResponse.json({ error: 'Name and ingredients are required' }, { status: 400 });
        }

        // Validate that all ingredients exist in products/inventory
        const ingredientValidation = await validateIngredients(ingredients);
        if (!ingredientValidation.isValid) {
            return NextResponse.json({ 
                error: 'Invalid ingredients', 
                details: ingredientValidation.errors 
            }, { status: 400 });
        }

        const { data, error } = await supabaseServerClient
            .from('products')
            .insert({ 
                name, 
                ingredients: JSON.stringify(ingredients), // Store with product IDs
                stock: amount, 
                category, 
                has_recipe: true 
            })
            .select();

        if (error) throw error;
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error creating recipe:', error.message);
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
        const { data, error } = await supabaseServerClient
            .from('products')
            .update({ name: updateData.name, ingredients: updateData.ingredients, stock: updateData.amount, category: updateData.category })
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
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Delete the user from the 'profiles' table
        const { data, error } = await supabaseServerClient
            .from('products') // Replace 'profiles' with your actual table name
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

// Helper function to validate ingredients exist in stock
async function validateIngredients(ingredients: any[]) {
    const errors = [];
    
    for (const ingredient of ingredients) {
        const { data: product } = await supabaseServerClient
            .from("products")
            .select("id, name, stock")
            .ilike("name", `%${ingredient.name}%`)
            .single();
            
        if (!product) {
            errors.push(`Ingredient "${ingredient.name}" not found in stock`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
