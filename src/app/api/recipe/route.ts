import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';
import { getCurrentUserInfo } from '@/lib/auditLogger';


export const GET = async () => {
    try {
        const { data, error } = await supabaseServerClient
            .from('products')
            .select('*')
            .in('type', ['recipe', 'ingredient'])
            .is('deleted_at', null)
            .order('id', { ascending: true });
        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching recipes and ingredients:', error.message);
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

        // Create the recipe product first
        const { data, error } = await supabaseServerClient
            .from('products')
            .insert({
                name,
                ingredients: JSON.stringify(ingredients), // Store with availableStock set to recipe amount
                stock: amount,
                category,
                type: 'recipe', // Set type as recipe
                has_recipe: false, // Set has_recipe as false for new recipes
                purchase_price: 0, // Recipes don't have purchase price
                sale_price: 0, // Recipes don't have sale price initially
                description: `Recipe with ${ingredientValidation.validatedIngredients.length} ingredients`,
                image_url: '' // Default empty image URL
            })
            .select();

        if (error) throw error;

        // Note: Stock deduction is handled by the recipe system, not individual product linking

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
        console.log("body: ", body)
        const { id, name, ingredients, amount, category } = body;

        if (!id) {
            return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
        }
        // if (!ingredients) {
        //     return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 });
        // }

        // Get the current recipe to get existing data
        const { data: currentRecipe, error: fetchError } = await supabaseServerClient
            .from('products')
            .select('name, ingredients, category')
            .eq('id', id)
            .single();

        if (fetchError || !currentRecipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        // Validate ingredients
        if (ingredients) {
            const ingredientValidation = await validateIngredients(ingredients);
            if (!ingredientValidation.isValid) {
                return NextResponse.json({
                    error: 'Invalid ingredients',
                    details: ingredientValidation.errors
                }, { status: 400 });
            }
        }
        // Use provided values or fall back to current recipe values
        const recipeName = name || currentRecipe.name;
        const recipeCategory = category || currentRecipe.category;

        // Update the recipe
        const { data, error } = await supabaseServerClient
            .from('products')
            .update({
                name: recipeName,
                ingredients: ingredients ? JSON.stringify(ingredients): currentRecipe.ingredients,
                category: recipeCategory
            })
            .eq('id', id)
            .select();

        if (error) {
            throw error;
        }

        // Create audit log for recipe update
        try {
            const userInfo = await getCurrentUserInfo();
            if (userInfo && data && data[0]) {
                const updatedRecipe = data[0];

                // Create description of changes
                const changes = [];
                if (name && name !== currentRecipe.name) {
                    changes.push(`Nombre: "${currentRecipe.name}" → "${name}"`);
                }
                if (category && category !== currentRecipe.category) {
                    changes.push(`Categoría: "${currentRecipe.category}" → "${category}"`);
                }
                if (ingredients) {
                    changes.push('Ingredientes actualizados');
                }

                const changeDescription = changes.length > 0
                    ? `Receta actualizada: ${changes.join(', ')}`
                    : 'Receta actualizada sin cambios detectados';

                await fetch(`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/api/audit-log`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: userInfo.user_id,
                        user_name: userInfo.user_name,
                        user_email: userInfo.user_email,
                        user_role: userInfo.user_role,
                        action: 'update',
                        action_type: 'recipe_update',
                        target_type: 'recipe',
                        target_id: updatedRecipe.id,
                        target_name: updatedRecipe.name,
                        description: changeDescription,
                        changes_before: currentRecipe,
                        changes_after: updatedRecipe,
                        status: 'success'
                    }),
                });
            }
        } catch (auditError) {
            console.error('Error creating audit log:', auditError);
            // Don't fail the request if audit logging fails
        }

        // Note: Stock changes are handled by the recipe system, not individual product linking

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error updating recipe:', error.message);
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

// Helper function to validate and clean ingredients
async function validateIngredients(ingredients: any[]) {
    const validatedIngredients = [];

    for (const ingredient of ingredients) {
        // Validate required fields
        if (!ingredient.name || !ingredient.quantity || !ingredient.unit) {
            continue; // Skip invalid ingredients
        }

        // Add clean ingredient, preserving availableStock if provided
        const cleanIngredient: any = {
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit
        };

        // Preserve availableStock if it exists
        if (ingredient.availableStock !== undefined) {
            cleanIngredient.availableStock = ingredient.availableStock;
        }

        validatedIngredients.push(cleanIngredient);
    }

    return {
        isValid: true, // Always valid since we're just cleaning the data
        errors: [],
        validatedIngredients
    };
}


