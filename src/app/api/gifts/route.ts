import { NextResponse, NextRequest } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const giftId = searchParams.get("giftId");
    const id = searchParams.get("id");

    // Handle both giftId and id parameters for compatibility
    const queryId = giftId || id;

    if (!queryId) {
      // If no ID provided, return all gifts
      const { data, error } = await supabaseServerClient
        .from("gifts")
        .select(
          `*, products (
                          id,
                          name,
                          image_url,
                          sale_price
                      ),  sender:profiles!sender_id (
            id,
            email,
            name
          )`
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      return NextResponse.json(data, { status: 200 });
    }

    // Get single gift by ID
    const { data, error } = await supabaseServerClient
      .from("gifts")
      .select(
        `*, products (
                        id,
                        name,
                        image_url,
                        sale_price
                    ),  sender:profiles!sender_id (
          id,
          email,
          name
        )`
      )
      .eq("id", queryId)
      .single();

    if (error) {
      throw error;
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching gift:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { data, error } = await supabaseServerClient
      .from("gifts")
      .insert(body);
    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error sending gift:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PUT = async (req: Request) => {
  try {
    const { id, ...body } = await req.json();
    const { data: giftData, error: giftError } = await supabaseServerClient
      .from("gifts")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (giftError) {
      throw giftError;
    }

    const { data: productData, error: productError } =
      await supabaseServerClient
        .from("products")
        .select("stock")
        .eq("id", giftData?.product_id)
        .single();
    if (productData && productData.stock > 0) {
      const { data: productUpdate, error: productUpdateError } =
        await supabaseServerClient
          .from("products")
          .update({ stock: productData.stock - 1 })
          .eq("id", giftData?.product_id)
          .select()
          .single();

      if (productUpdateError) {
        throw productUpdateError;
      }
    }

    return NextResponse.json(giftData, { status: 200 });
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
