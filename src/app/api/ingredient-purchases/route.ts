import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseServerClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ingredientId = searchParams.get('ingredient_id');
    const productId = searchParams.get('product_id');

    if (!ingredientId && !productId) {
      return NextResponse.json({ error: 'ingredient_id or product_id is required' }, { status: 400 });
    }

    let query = supabaseServerClient
      .from('stock_purchases')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (ingredientId) {
      query = query.eq('ingredient_id', ingredientId);
    } else if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredient_id, product_id, stock, unit_price, supplier, purchase_date, notes, responsible_user } = body;

    // Validate required fields
    if ((!ingredient_id && !product_id) || !stock || !unit_price || !supplier || !purchase_date) {
      return NextResponse.json(
        { error: 'Missing required fields (need either ingredient_id or product_id)' },
        { status: 400 }
      );
    }

    if (stock <= 0 || unit_price <= 0) {
      return NextResponse.json(
        { error: 'Stock and unit price must be greater than 0' },
        { status: 400 }
      );
    }

    // Calculate weighted average cost
    let resulting_average_cost = unit_price;
    let currentStock = 0;
    let currentPurchasePrice = 0;

    // Get current stock and purchase price
    if (ingredient_id) {
      const { data: ingredientData } = await supabaseServerClient
        .from('ingredients')
        .select('stock, purchase_price')
        .eq('id', ingredient_id)
        .single();

      if (ingredientData) {
        currentStock = ingredientData.stock || 0;
        currentPurchasePrice = ingredientData.purchase_price || 0;
      }
    } else if (product_id) {
      const { data: productData } = await supabaseServerClient
        .from('products')
        .select('stock, purchase_price')
        .eq('id', product_id)
        .single();

      if (productData) {
        currentStock = productData.stock || 0;
        currentPurchasePrice = productData.purchase_price || 0;
      }
    }

    // Calculate weighted average cost
    if (currentStock > 0 && currentPurchasePrice > 0) {
      const totalCurrentValue = currentStock * currentPurchasePrice;
      const totalNewValue = stock * unit_price;
      const totalStock = currentStock + stock;
      resulting_average_cost = (totalCurrentValue + totalNewValue) / totalStock;
    }

    const { data, error } = await supabaseServerClient
      .from('stock_purchases')
      .insert([{
        ingredient_id: ingredient_id || null,
        product_id: product_id || null,
        stock,
        unit_price,
        supplier,
        purchase_date,
        notes: notes || null,
        responsible_user: responsible_user || 'John Smith',
        resulting_average_cost
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update stock and average price
    if (ingredient_id) {
      const { error: updateError } = await supabaseServerClient
        .from('ingredients')
        .update({
          stock: currentStock + stock,
          purchase_price: resulting_average_cost
        })
        .eq('id', ingredient_id);

      if (updateError) {
        console.error('Error updating ingredient:', updateError);
      }
    } else if (product_id) {
      const { error: updateError } = await supabaseServerClient
        .from('products')
        .update({
          stock: currentStock + stock,
          purchase_price: resulting_average_cost
        })
        .eq('id', product_id);

      if (updateError) {
        console.error('Error updating product:', updateError);
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }
}
