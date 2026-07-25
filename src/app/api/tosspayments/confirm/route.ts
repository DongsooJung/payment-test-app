import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { paymentKey, orderId, amount } = await request.json();
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (
    typeof paymentKey !== "string" ||
    !paymentKey ||
    typeof orderId !== "string" ||
    !orderId ||
    !Number.isInteger(amount) ||
    amount < 100 ||
    amount > 100_000_000
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "결제 승인 정보가 올바르지 않습니다." },
      },
      { status: 400 }
    );
  }

  if (!secretKey) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "TOSS_SECRET_KEY가 설정되지 않았습니다." },
      },
      { status: 503 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "실제 결제에는 Supabase 서버 설정이 필요합니다." },
      },
      { status: 503 }
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("payment_logs")
    .select("provider,amount,status,payment_key")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json(
      { success: false, error: { message: orderError.message } },
      { status: 500 }
    );
  }

  if (
    !order ||
    order.provider !== "tosspayments" ||
    order.amount !== amount
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "서버 주문 정보와 결제 승인 정보가 일치하지 않습니다." },
      },
      { status: 400 }
    );
  }

  if (order.status === "success" && order.payment_key === paymentKey) {
    return NextResponse.json({ success: true, alreadyConfirmed: true });
  }

  if (order.status !== "pending") {
    return NextResponse.json(
      {
        success: false,
        error: { message: "이미 처리된 주문입니다." },
      },
      { status: 409 }
    );
  }

  const encryptedSecretKey = Buffer.from(secretKey + ":").toString("base64");
  try {
    const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encryptedSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const data = await res.json();

    if (res.ok) {
      const { error: updateError } = await supabase
        .from("payment_logs")
        .update({
          status: "success",
          payment_key: paymentKey,
          raw_response: data,
        })
        .eq("order_id", orderId);

      if (updateError) {
        console.error("결제 승인 로그 저장 실패:", updateError.message);
      }
      return NextResponse.json({
        success: true,
        data,
        persisted: !updateError,
      });
    }

    await supabase
      .from("payment_logs")
      .update({ status: "fail", raw_response: data })
      .eq("order_id", orderId);
    return NextResponse.json(
      { success: false, error: data },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
