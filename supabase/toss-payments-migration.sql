-- ================================================
-- 토스페이먼츠 연동을 위한 마이그레이션
-- ================================================

-- 1. campaign_payments 테이블에 토스 관련 컬럼 추가
ALTER TABLE campaign_payments
ADD COLUMN IF NOT EXISTS toss_payment_key VARCHAR(200),
ADD COLUMN IF NOT EXISTS toss_secret VARCHAR(200);

-- 인덱스 추가 (paymentKey로 조회 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_campaign_payments_toss_payment_key
ON campaign_payments(toss_payment_key)
WHERE toss_payment_key IS NOT NULL;

-- 2. 결제 로그 테이블 (선택사항 - 웹훅 히스토리 저장)
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES campaign_payments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- RLS 정책
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 로그 조회 가능
CREATE POLICY "Admins can view payment logs"
ON payment_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 서비스 역할은 모든 작업 가능
CREATE POLICY "Service role can manage payment logs"
ON payment_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ================================================
-- 확인 쿼리
-- ================================================

-- 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'campaign_payments'
AND column_name IN ('toss_payment_key', 'toss_secret');

-- 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'payment_logs';

COMMENT ON COLUMN campaign_payments.toss_payment_key IS '토스페이먼츠 결제 키';
COMMENT ON COLUMN campaign_payments.toss_secret IS '토스페이먼츠 웹훅 검증용 시크릿';
COMMENT ON TABLE payment_logs IS '결제 이벤트 로그 (웹훅 히스토리)';
