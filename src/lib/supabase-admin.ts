import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;

function required(name: string, fallbackName?: string) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient(
      required("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
      required("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
  }
  return adminClient;
}

export type PaymentStatus =
  | "ready"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "partial_cancelled";

export type PaymentOrder = {
  id: string;
  payment_id: string;
  provider: "portone_eximbay_alipay";
  product_id: string;
  product_name: string;
  amount_minor: number;
  currency: "USD";
  status: PaymentStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  transaction_id: string | null;
  pg_tx_id: string | null;
  raw_payment: Record<string, unknown> | null;
  verification_error: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};
