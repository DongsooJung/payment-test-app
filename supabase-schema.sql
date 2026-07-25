-- 결제 로그 테이블
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('tosspayments', 'naverpay', 'kakaopay')),
  order_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'fail', 'cancelled')),
  payment_key TEXT,
  customer_name TEXT,
  product_name TEXT NOT NULL,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_provider ON payment_logs(provider);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_updated_at ON payment_logs;
CREATE TRIGGER trigger_update_updated_at
  BEFORE UPDATE ON payment_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 기존 Stripe 로그는 보존하되 신규 Stripe 값은 차단합니다. NOT VALID 제약은
-- 기존 행을 재검증하지 않고 이후 INSERT/UPDATE부터 적용됩니다.
ALTER TABLE payment_logs DROP CONSTRAINT IF EXISTS payment_logs_provider_check;
ALTER TABLE payment_logs
  ADD CONSTRAINT payment_logs_provider_check
  CHECK (provider IN ('tosspayments', 'naverpay', 'kakaopay')) NOT VALID;

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs FORCE ROW LEVEL SECURITY;

-- 브라우저의 anon key로 결제 기록을 읽거나 쓰지 않습니다.
-- 서버 Route Handler의 SUPABASE_SERVICE_ROLE_KEY는 RLS를 우회합니다.
DROP POLICY IF EXISTS "Allow all access" ON payment_logs;
REVOKE ALL ON TABLE payment_logs FROM anon, authenticated;
GRANT ALL ON TABLE payment_logs TO service_role;
