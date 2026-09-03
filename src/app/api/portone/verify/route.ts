import { NextRequest, NextResponse } from "next/server";
import { syncPayment } from "@/lib/portone";

const PAYMENT_ID_PATTERN = /^alipay-[0-9a-f-]{36}$/;

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();
    if (typeof paymentId !== "string" || !PAYMENT_ID_PATTERN.test(paymentId)) {
      return NextResponse.json({ error: "Invalid paymentId" }, { status: 400 });
    }
    return NextResponse.json(await syncPayment(paymentId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "PAYMENT_VERIFY_FAILED";
    const status = message === "ORDER_NOT_FOUND" ? 404 : message === "PAYMENT_MISMATCH" ? 409 : 502;
    console.error("PortOne verification failed", message);
    return NextResponse.json({ error: message }, { status });
  }
}
