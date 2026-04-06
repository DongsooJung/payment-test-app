import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { paymentKey, orderId, amount } = await request.json();
  const secretKey = process.env.TOSS_SECRET_KEY;
  const encryptedSecretKey = Buffer.from(secretKey + ":").toString("base64");
  try {
    const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", { method: "POST", headers: { Authorization: `Basic ${encryptedSecretKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ paymentKey, orderId, amount }) });
    const data = await res.json();
    if (res.ok) { await supabase.from("payment_logs").update({ status: "success", payment_key: paymentKey, raw_response: data }).eq("order_id", orderId); return NextResponse.json({ success: true, data }); }
    else { await supabase.from("payment_logs").update({ status: "fail", raw_response: data }).eq("order_id", orderId); return NextResponse.json({ success: false, error: data }, { status: 400 }); }
  } catch (error) { return NextResponse.json({ success: false, error: String(error) }, { status: 500 }); }
}
