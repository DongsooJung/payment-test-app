# STARGATE Alipay+ payment test

PortOne V2, Eximbay new module, and Alipay+ test checkout for STARGATE.

## Security model

- The product and USD 1.00 test price are selected on the server.
- The browser never receives a Supabase secret or PortOne API secret.
- The return page and webhook both query PortOne again before marking an order paid.
- PortOne amount, currency, payment ID, and order name must match the server-side order.
- `payment_orders` has RLS enabled and no `anon` or `authenticated` policy.
- Webhooks use Standard Webhooks signature verification when `PORTONE_WEBHOOK_SECRET` is set.

## Setup

1. Copy `.env.example` to `.env.local` and set the required deployment values.
2. Run `supabase-schema.sql` in the target Supabase project.
3. In PortOne V2, connect the Eximbay new-module channel and enable Alipay/Alipay+ on the MID.
4. Configure the V2 webhook endpoint as `https://<host>/api/portone/webhook` with webhook version `2024-04-25`.
5. Start locally with `npm install && npm run dev`.

The checkout requests Eximbay payment method `P003`, which means Alipay or Alipay Plus according to the MID configuration.

## Required environment variables

See `.env.example`. `SUPABASE_SECRET_KEY`, `PORTONE_API_SECRET`, and `PORTONE_WEBHOOK_SECRET` are server-only secrets and must never be exposed with a `NEXT_PUBLIC_` prefix.

## Verification

```bash
npm run lint
npm run build
```
