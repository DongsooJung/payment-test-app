import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { orderId, amount, productName, customerName } = await request.json();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  try {
    await supabase.from("payment_logs").insert({ provider: "stripe", order_id: orderId, amount, status: "pending", product_name: productName, customer_name: customerName });
    if (!secretKey || secretKey === "sk_test_your_stripe_secret_key") {
      return NextResponse.json({ url: `${baseUrl}/payment/success?provider=stripe&orderId=${orderId}&amount=${amount}&demo=true` });
    }
    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    const session = await stripe.checkout.sessions.create({ payment_method_types: ["card"], line_items: [{ price_data: { currency: "krw", product_data: { name: productName }, unit_amount: amount }, quantity: 1 }], mode: "payment", success_url: `${baseUrl}/payment/success?provider=stripe&orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${baseUrl}/payment/fail?provider=stripe&reason=cancelled`, metadata: { orderId, customerName } });
    await supabase.from("payment_logs").update({ payment_key: session.id }).eq("order_id", orderId);
    return NextResponse.json({ url: session.url });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}
