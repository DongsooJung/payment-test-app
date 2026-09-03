import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  const expected = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  return origin === new URL(expected).origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const storeId = process.env.PORTONE_STORE_ID;
  const channelKey = process.env.PORTONE_EXIMBAY_CHANNEL_KEY;
  if (!storeId || !channelKey || !process.env.PORTONE_API_SECRET) {
    return NextResponse.json(
      { error: "PortOne Eximbay test channel is not configured" },
      { status: 503 },
    );
  }

  const body = await request.json();
  const product = getProduct(text(body.productId, 80));
  const customerName = text(body.customerName, 100);
  const customerEmail = text(body.customerEmail, 254).toLowerCase();
  const customerPhone = text(body.customerPhone, 30);

  if (!product || customerName.length < 2 || !EMAIL_PATTERN.test(customerEmail)) {
    return NextResponse.json({ error: "Invalid order information" }, { status: 400 });
  }

  const paymentId = `alipay-${randomUUID()}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const productUrl = `${baseUrl}/`;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("payment_orders").insert({
    payment_id: paymentId,
    provider: "portone_eximbay_alipay",
    product_id: product.id,
    product_name: product.name,
    amount_minor: product.amountMinor,
    currency: product.currency,
    status: "ready",
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone || null,
  });

  if (error) {
    console.error("Order insert failed", error.code);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  return NextResponse.json({
    storeId,
    channelKey,
    paymentId,
    orderName: product.name,
    totalAmount: product.amountMinor,
    currency: product.currency,
    payMethod: "ALIPAY",
    locale: "ZH_CN",
    customer: {
      fullName: customerName,
      email: customerEmail,
      ...(customerPhone ? { phoneNumber: customerPhone } : {}),
    },
    products: [
      {
        id: product.id,
        name: product.name,
        amount: product.amountMinor,
        quantity: 1,
        link: productUrl,
      },
    ],
    bypass: {
      eximbay_v2: {
        payment: { payment_method: "P003" },
        merchant: { shop: "STARGATE" },
      },
    },
    redirectUrl: `${baseUrl}/payment/success?provider=alipay&paymentId=${encodeURIComponent(paymentId)}`,
    noticeUrls: [`${baseUrl}/api/portone/webhook`],
  });
}
