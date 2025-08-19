import { type NextRequest, NextResponse } from "next/server";
import { supabase as supabaseServerClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }
    // Fetch all data in parallel
    const [
      { data: receivedTransfers },
      { data: sentTransfers },
      { data: chargeTransfers }
    ] = await Promise.all([
      supabaseServerClient
        .from('balance_transfers')
        .select("*, user:profiles!from_user(email, name)")
        .eq('to_user', userId),
      supabaseServerClient
        .from('balance_transfers')
        .select("*, user:profiles!to_user(email, name)")
        .eq('from_user', userId),
      supabaseServerClient
        .from('transactions')
        .select("*")
        .eq('user_id', userId)
    ]);

    // Transform and combine all transfers
    const allTransactions = [
      ...(receivedTransfers?.map((transfer) => ({
        id: transfer.id,
        type: "received" as const,
        createdAt: transfer.created_at,
        amount: transfer.amount,
        user_id: transfer.to_user,
        status: transfer.status,
        counterparty: transfer.user.name || transfer.user?.email 
      })) || []),
      ...(sentTransfers?.map((transfer) => ({
        id: transfer.id,
        type: "sent" as const,
        createdAt: transfer.created_at,
        amount: transfer.amount,
        user_id: transfer.from_user,
        status: transfer.status,
        counterparty: transfer.user.name || transfer.user?.email 
      })) || []),
      ...(chargeTransfers?.map((transfer) => ({
        id: transfer.id,
        type: "charge" as const,
        createdAt: transfer.created_at,
        amount: transfer.amount,
        user_id: transfer.user_id,
        status: transfer.status,
        paymentUrl: transfer.payment_url
      })) || [])
    ];

    // Sort by createdAt in descending order
    const sortedTransactions = allTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ 
      data: sortedTransactions,
      status: 200 
    });

  } catch (error: any) {
    console.error('Error fetching transactions:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}