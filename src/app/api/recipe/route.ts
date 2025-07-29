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

        // Create the recipe product first
        const { data, error } = await supabaseServerClient
            .from('products')
            .insert({
                name,
                ingredients: JSON.stringify(ingredientValidation.validatedIngredients), // Store with linked product info
                stock: amount,
                category,
                has_recipe: true
            })
            .select();

        if (error) throw error;

        // Deduct ingredient stock if recipe amount > 0
        if (amount > 0) {
            await deductIngredientStock(ingredientValidation.validatedIngredients, amount);
        }

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
        const { id, name, ingredients, amount, category } = body;

        if (!id) {
            return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
        }
        if (!name || !ingredients) {
            return NextResponse.json({ error: 'Name and ingredients are required' }, { status: 400 });
        }

        // Get the current recipe to compare stock changes
        const { data: currentRecipe, error: fetchError } = await supabaseServerClient
            .from('products')
            .select('stock, ingredients')
            .eq('id', id)
            .single();

        if (fetchError || !currentRecipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        // Validate ingredients
        const ingredientValidation = await validateIngredients(ingredients);
        if (!ingredientValidation.isValid) {
            return NextResponse.json({
                error: 'Invalid ingredients',
                details: ingredientValidation.errors
            }, { status: 400 });
        }

        // Update the recipe
        const { data, error } = await supabaseServerClient
            .from('products')
            .update({
                name,
                ingredients: JSON.stringify(ingredientValidation.validatedIngredients),
                stock: amount,
                category
            })
            .eq('id', id)
            .select();

        if (error) {
            throw error;
        }

        // Handle stock changes if recipe amount increased
        const currentAmount = currentRecipe.stock || 0;
        const newAmount = amount || 0;
        const stockIncrease = newAmount - currentAmount;

        if (stockIncrease > 0) {
            // Deduct additional ingredient stock for the increased amount
            await deductIngredientStock(ingredientValidation.validatedIngredients, stockIncrease);
        }

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

// Helper function to validate ingredients exist in stock and link them to products
async function validateIngredients(ingredients: any[]) {
    const errors = [];
    const validatedIngredients = [];

    for (const ingredient of ingredients) {
        let linkedProduct = null;

        // If ingredient already has a productId, validate it exists
        if (ingredient.productId) {
            const { data: product } = await supabaseServerClient
                .from("products")
                .select("id, name, stock")
                .eq("id", ingredient.productId)
                .single();

            if (product) {
                linkedProduct = product;
            } else {
                errors.push(`Product with ID "${ingredient.productId}" not found for ingredient "${ingredient.name}"`);
                continue;
            }
        } else {
            // Try to find a matching product by name
            const { data: products } = await supabaseServerClient
                .from("products")
                .select("id, name, stock")
                .ilike("name", `%${ingredient.name}%`)
                .eq("has_recipe", false); // Only link to non-recipe products

            if (products && products.length > 0) {
                // Use the first matching product
                linkedProduct = products[0];
            }
        }

        // Add the ingredient with linked product info
        validatedIngredients.push({
            ...ingredient,
            productId: linkedProduct?.id || null,
            linkedProductName: linkedProduct?.name || null,
            availableStock: linkedProduct?.stock || 0
        });

        // Warn if no product was found but don't fail validation
        if (!linkedProduct) {
            console.warn(`No matching product found for ingredient "${ingredient.name}". Recipe will use ingredient name only.`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        validatedIngredients
    };
}

// Helper function to deduct ingredient stock when creating recipes
async function deductIngredientStock(ingredients: any[], recipeAmount: number) {
    for (const ingredient of ingredients) {
        const requiredQuantity = parseFloat(ingredient.quantity) * recipeAmount;

        // Skip if no linked product
        if (!ingredient.productId) {
            console.warn(`No linked product for ingredient: ${ingredient.name}. Skipping stock deduction.`);
            continue;
        }

        // Get current product stock
        const { data: product, error: fetchError } = await supabaseServerClient
            .from("products")
            .select("id, name, stock")
            .eq("id", ingredient.productId)
            .single();

        if (fetchError || !product) {
            console.error(`Failed to fetch product for ingredient: ${ingredient.name}`);
            continue;
        }

        // Check if sufficient stock is available
        if (product.stock < requiredQuantity) {
            throw new Error(`Insufficient stock for ingredient: ${ingredient.name}. Available: ${product.stock}, Required: ${requiredQuantity}`);
        }

        // Deduct stock
        const { error: updateError } = await supabaseServerClient
            .from("products")
            .update({
                stock: product.stock - requiredQuantity
            })
            .eq("id", ingredient.productId);

        if (updateError) {
            throw new Error(`Failed to deduct stock for ingredient: ${ingredient.name}`);
        }

        console.log(`Deducted ${requiredQuantity} units of ${ingredient.name} from stock. Remaining: ${product.stock - requiredQuantity}`);
    }
}
