import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { orderId, status, provider } = await request.json();

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("payment_logs")
    .update({ status })
    .eq("order_id", orderId);

  if (error) {
    if (error.code === "PGRST116") {
      await supabase.from("payment_logs").insert({
        provider,
        order_id: orderId,
        amount: 0,
        status,
        product_name: "데모 결제",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
