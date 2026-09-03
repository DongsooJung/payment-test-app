-- STARGATE payment orders. All access is server-side only.
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  payment_id text not null unique check (payment_id ~ '^alipay-[0-9a-f-]{36}$'),
  provider text not null default 'portone_eximbay_alipay'
    check (provider = 'portone_eximbay_alipay'),
  product_id text not null,
  product_name text not null check (char_length(product_name) between 2 and 200),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency in ('USD')),
  status text not null default 'ready'
    check (status in ('ready', 'pending', 'paid', 'failed', 'cancelled', 'partial_cancelled')),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_email text not null check (char_length(customer_email) between 3 and 254),
  customer_phone text,
  transaction_id text,
  pg_tx_id text,
  raw_payment jsonb,
  verification_error text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_orders_status_created_idx
  on public.payment_orders (status, created_at desc);

alter table public.payment_orders enable row level security;

-- No anon/authenticated policy is intentional. Payments contain PII and may
-- only be accessed with a backend secret key after PortOne verification.
revoke all on table public.payment_orders from public, anon, authenticated;
grant all on table public.payment_orders to service_role;

comment on table public.payment_orders is
  'Server-only PortOne/Eximbay Alipay+ orders; protected by RLS and revoked Data API grants.';
