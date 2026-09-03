import "server-only";

import * as PortOne from "@portone/server-sdk";
import { getSupabaseAdmin, type PaymentStatus } from "@/lib/supabase-admin";

function getClient() {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) throw new Error("PORTONE_API_SECRET is not configured");
  return PortOne.PortOneClient({ secret });
}

function mapStatus(status: string): PaymentStatus {
  switch (status) {
    case "PAID":
      return "paid";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    case "PARTIAL_CANCELLED":
      return "partial_cancelled";
    case "PAY_PENDING":
      return "pending";
    default:
      return "ready";
  }
}

export async function syncPayment(paymentId: string) {
  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("payment_id", paymentId)
    .single();

  if (orderError || !order) throw new Error("ORDER_NOT_FOUND");

  const payment = await getClient().payment.getPayment({ paymentId });
  if (!("id" in payment)) throw new Error("UNKNOWN_PAYMENT_STATUS");

  const isConsistent =
    payment.id === order.payment_id &&
    payment.amount.total === order.amount_minor &&
    payment.currency === order.currency &&
    payment.orderName === order.product_name;

  if (!isConsistent) {
    await supabase
      .from("payment_orders")
      .update({ verification_error: "Payment amount, currency, or order data mismatch" })
      .eq("payment_id", paymentId);
    throw new Error("PAYMENT_MISMATCH");
  }

  const status = mapStatus(payment.status);
  const update = {
    status,
    transaction_id: payment.transactionId,
    pg_tx_id: "pgTxId" in payment ? payment.pgTxId ?? null : null,
    raw_payment: JSON.parse(JSON.stringify(payment)),
    verification_error: null,
    paid_at: "paidAt" in payment ? payment.paidAt ?? null : null,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("payment_orders")
    .update(update)
    .eq("payment_id", paymentId);
  if (updateError) throw updateError;

  return { paymentId, status, paid: status === "paid" };
}
