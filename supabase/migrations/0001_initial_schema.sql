-- 0001_initial_schema.sql
-- 기본 사용자 확장 + 사용량 원장

CREATE TABLE IF NOT EXISTS users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT,
  billing_provider TEXT,                       -- 'toss' | 'stripe'
  billing_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users_extended(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  task TEXT NOT NULL,                          -- 'character'|'scene'|'sketch'|'export'
  cost_cents INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_ledger_user ON usage_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_task ON usage_ledger(task);

-- 월간 쿼터 집계 테이블 (예약/사용 카운터)
CREATE TABLE IF NOT EXISTS quota_counters (
  user_id UUID NOT NULL REFERENCES users_extended(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  used_characters INTEGER NOT NULL DEFAULT 0,
  used_panels INTEGER NOT NULL DEFAULT 0,
  used_exports INTEGER NOT NULL DEFAULT 0,
  reserved_characters INTEGER NOT NULL DEFAULT 0,
  reserved_panels INTEGER NOT NULL DEFAULT 0,
  reserved_exports INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period_year, period_month)
);
