import "server-only";

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return _supabase;
}

export type PaymentLog = {
  id?: string;
  provider: 'tosspayments' | 'naverpay' | 'kakaopay';
  order_id: string;
  amount: number;
  status: 'pending' | 'success' | 'fail' | 'cancelled';
  payment_key?: string;
  customer_name?: string;
  product_name: string;
  raw_response?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};
