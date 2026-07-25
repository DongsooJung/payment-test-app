import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { orderId, provider, amount, productName, customerName } =
    await request.json();

  if (
    typeof orderId !== "string" ||
    orderId.length < 10 ||
    orderId.length > 64 ||
    provider !== "tosspayments" ||
    !Number.isInteger(amount) ||
    amount < 100 ||
    amount > 100_000_000 ||
    typeof productName !== "string" ||
    !productName.trim() ||
    productName.length > 100 ||
    (typeof customerName === "string" && customerName.length > 80)
  ) {
    return NextResponse.json(
      { error: "주문 정보가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "실제 결제에는 Supabase 서버 설정이 필요합니다." },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("payment_logs").insert({
    provider: "tosspayments",
    order_id: orderId,
    amount,
    status: "pending",
    product_name: productName.trim(),
    customer_name:
      typeof customerName === "string" ? customerName.trim() : null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "이미 존재하는 주문 번호입니다." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
