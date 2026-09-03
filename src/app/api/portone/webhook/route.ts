import { NextRequest, NextResponse } from "next/server";
import * as PortOne from "@portone/server-sdk";
import { syncPayment } from "@/lib/portone";

export async function POST(request: NextRequest) {
  const payload = await request.text();

  try {
    let paymentId: string | undefined;
    const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;

    if (!webhookSecret && process.env.NODE_ENV === "production") {
      return new NextResponse(null, { status: 503 });
    }

    if (webhookSecret) {
      const webhook = await PortOne.Webhook.verify(
        webhookSecret,
        payload,
        Object.fromEntries(request.headers.entries()),
      );
      if ("data" in webhook && "paymentId" in webhook.data) {
        paymentId = webhook.data.paymentId;
      }
    } else {
      // Test fallback: the payload itself is never trusted. We only extract the
      // random payment ID, then query PortOne and validate it against our order.
      const webhook = JSON.parse(payload) as { data?: { paymentId?: unknown } };
      if (typeof webhook.data?.paymentId === "string") paymentId = webhook.data.paymentId;
    }

    if (paymentId?.startsWith("alipay-")) await syncPayment(paymentId);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof PortOne.Webhook.WebhookVerificationError) {
      return new NextResponse(null, { status: 400 });
    }
    console.error("PortOne webhook failed", error);
    return new NextResponse(null, { status: 500 });
  }
}
