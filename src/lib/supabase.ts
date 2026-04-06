import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string, unknown>)[prop as string];
  },
});

export type PaymentLog = {
  id?: string;
  provider: 'tosspayments' | 'naverpay' | 'kakaopay' | 'stripe';
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
