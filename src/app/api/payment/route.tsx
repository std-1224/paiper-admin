import { type NextRequest, NextResponse } from "next/server";
import { createSupaClient } from "@/lib/supabaseClient";
// import { v4 as uuidv4 } from 'uuid';

const supabase = createSupaClient();

export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    const { chargeAmount, userId, payer } = body;
    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          amount: chargeAmount,
          type: "charge",
          status: "pending",
        },
      ])
      .select()
      .single();
    if (error) {
      console.error("Error creating transaction:", error);
      return NextResponse.json(
        {
          message: "An unexpected error occurred",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const preferenceData = {
      items: [
        {
          id: transaction.id,
          title: "Charge your balance",
          description: `Charge your balance with ${chargeAmount} ARS`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: chargeAmount,
        },
      ],
      payer: {
        email: payer.email,
        name: payer.name || undefined,
      },
      external_reference: transaction.id,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/pending`,
      },
      // Remove auto_return as it's causing issues
      notification_url: `${process.env.NEXT_PUBLIC_WEB_URL}/api/payment/webhook`,
      statement_descriptor: "Papel Restaurant",
    };

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(preferenceData),
      }
    );

    const mpResponse = await response.json();
    const resData = {
      id: mpResponse.id,
      status: "pending",
      statusDetail: "pending_payment",
      transactionAmount: chargeAmount,
      currencyId: "ARS",
      paymentMethodId: "",
      installments: 1,
      dateCreated: new Date().toISOString(),
      paymentUrl: mpResponse.init_point || "",
      // paymentUrl: mpResponse.sandbox_init_point || "",
    };

    const { data: transactionUpdate, error: transactionError } = await supabase
      .from("transactions")
      .update({
        payment_url: mpResponse.init_point || "",
        preference_id: mpResponse.id,
      })
      .eq("id", transaction.id);

    if (transactionError) {
      console.error("Error updating transaction:", transactionError);
      return NextResponse.json(
        {
          message: "An unexpected error occurred",
          error: transactionError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: resData, status: 200 });
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
