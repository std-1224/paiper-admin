import { NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';


export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        let query = supabaseServerClient
            .from("products")
            .select("*")
            .order("id", { ascending: true })
            .is('recipe_id', null)
            .is('ingredient_id', null)
            .is('deleted_at', null);

        // Filter by type if specified
        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching products:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const { data, error } = await supabaseServerClient
            .from('products')
            .insert([{
                name: body.name,
                description: body.description,
                category: body.category,
                stock: body.stock,
                image_url: body.image_url,
                purchase_price: body.purchase_price,
                sale_price: body.sale_price,
                type: body.type || 'product', // Default type is "product"
                has_recipe: body.has_recipe || false,
                is_active: body.is_active !== undefined ? body.is_active : true,
                is_pr: body.is_pr || false,
                is_courtsey: body.is_courtsey || false,
                recipe_id: body.recipe_id || null,
                ingredient_id: body.ingredient_id || null,
                // ingredients: body.ingredients || null,
                // is_liquid: body.is_liquid || false,
                // total_amount: body.total_amount || null
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log("data", data)

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Error creating user:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};


export const PUT = async (req: Request) => {
    try {
        // Parse the request body
        const requestData = await req.json();
        const {id, operation, ...body} = requestData;

        console.log('PUT /api/products - Request data:', requestData);

        let updateData = body;

        // Handle stock deduction operation
        if (operation === 'deduct' && body.stock !== undefined) {
            // First, get the current product data
            const { data: currentProduct, error: fetchError } = await supabaseServerClient
                .from('products')
                .select('stock, type')
                .eq('id', id)
                .single();

            if (fetchError) {
                throw fetchError;
            }
            if (currentProduct.type === 'ingredient') {
                updateData = { ...body};
            } else {
                // For regular products, deduct from stock as usual
                const newStock = currentProduct.stock + body.stock;

                if (newStock < 0) {
                    throw new Error(`Insufficient stock. Available: ${currentProduct.stock}, Required: ${Math.abs(body.stock)}`);
                }

                updateData = { ...body, stock: newStock };
            }
        }

        console.log('PUT /api/products - Update data:', updateData);

        const { data, error } = await supabaseServerClient
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select(); // Add select() to return the updated data

        console.log('PUT /api/products - Supabase response:', {data, error});

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 }); // Return the updated product
    } catch (error: any) {
        console.error('Error updating product:', error.message);
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
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        // First, get the product to check if it's an ingredient-type product or ingredient being sold as product
        const { data: product, error: fetchError } = await supabaseServerClient
            .from('products')
            .select('id, type, name, ingredient_id, recipe_id')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Error fetching product:', fetchError);
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Initialize tracking variables for soft deletion
        const deletedAt = new Date().toISOString();
        let softDeletedItems = {
            products: 0,
            ingredients: 0,
            recipes: 0,
            recipeIngredients: 0
        };

        // Delete inventory records (safe to delete as they're just stock tracking)
        const invRes = await supabaseServerClient.from('inventory').delete().eq('product_id', id);

        if (invRes.error) {
            console.error('Error deleting inventory records:', invRes.error);
            // Continue with deletion, inventory records are not critical
        }

        // Handle different product types with soft deletion
        console.log(`Starting soft deletion of product: ${product.name} (ID: ${id})`);

        // 1. Soft delete the product itself
        const { error: productDeleteError } = await supabaseServerClient
            .from('products')
            .update({ deleted_at: deletedAt })
            .eq('id', id);

        if (productDeleteError) {
            console.error('Error soft deleting product:', productDeleteError);
            return NextResponse.json(
                { error: 'Failed to delete product' },
                { status: 500 }
            );
        } else {
            softDeletedItems.products++;
            console.log(`Soft deleted product: ${product.name}`);
        }

        // 2. Handle ingredient-type product (has ingredient_id)
        if (product.ingredient_id) {
            console.log(`Product is ingredient-type, soft deleting ingredient: ${product.ingredient_id}`);

            // Soft delete the ingredient
            const { error: ingredientDeleteError } = await supabaseServerClient
                .from('ingredients')
                .update({ deleted_at: deletedAt })
                .eq('id', product.ingredient_id);

            if (ingredientDeleteError) {
                console.error('Error soft deleting ingredient:', ingredientDeleteError);
            } else {
                softDeletedItems.ingredients++;
                console.log(`Soft deleted ingredient with ID: ${product.ingredient_id}`);
            }

            // Soft delete recipe_ingredients that reference this ingredient
            const { data: riData, error: riDeleteError } = await supabaseServerClient
                .from('recipe_ingredients')
                .update({ deleted_at: deletedAt })
                .eq('ingredient_id', product.ingredient_id)
                .select('id');

            if (riDeleteError) {
                console.error('Error soft deleting recipe ingredients:', riDeleteError);
            } else if (riData) {
                softDeletedItems.recipeIngredients += riData.length;
                console.log(`Soft deleted ${riData.length} recipe ingredients for ingredient`);
            }
        }
        // 3. Handle regular ingredient-type product (type === 'ingredient')
        if (product.type === 'ingredient') {
            console.log(`Product is ingredient-type, soft deleting associated ingredient`);

            // Soft delete ingredient where product_id matches
            const { data: ingredientData, error: ingredientDeleteError } = await supabaseServerClient
                .from('ingredients')
                .update({ deleted_at: deletedAt })
                .eq('product_id', id)
                .select('id');

            if (ingredientDeleteError) {
                console.error('Error soft deleting ingredient:', ingredientDeleteError);
            } else if (ingredientData && ingredientData.length > 0) {
                softDeletedItems.ingredients += ingredientData.length;
                console.log(`Soft deleted ${ingredientData.length} ingredients for ingredient-type product`);
            }
        }

        console.log(`Soft deletion completed for product: ${product.name}`);
        console.log('Soft deletion summary:', softDeletedItems);

        return NextResponse.json({
            message: 'Product soft deleted successfully',
            deletedProduct: {
                id: product.id,
                name: product.name,
                type: product.type
            },
            softDeletedItems: softDeletedItems,
            deletedAt: deletedAt
        }, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error deleting product:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
};