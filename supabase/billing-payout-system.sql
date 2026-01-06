-- =====================================================
-- 결제 및 정산(Billing & Payout) 시스템 마이그레이션
-- =====================================================

-- 1. 새로운 Enum 타입 추가
-- -----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'virtual_account');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. 플랫폼 설정 테이블 (agency_fee 등 관리)
-- -----------------------------------------------------
-- settings 테이블이 이미 있으므로, 초기 설정값 insert
INSERT INTO settings (key, value, updated_at) VALUES
  ('agency_fee_per_person', '3000', NOW()),
  ('withholding_tax_rate', '0.033', NOW()),
  ('min_withdrawal_amount', '10000', NOW()),
  ('withdrawal_fee', '0', NOW())
ON CONFLICT (key) DO NOTHING;


-- 3. campaigns 테이블에 정산 관련 컬럼 추가
-- -----------------------------------------------------
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS agency_fee_per_person INTEGER DEFAULT 3000;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS supply_price INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS vat_amount INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_billing_amount INTEGER DEFAULT 0;


-- 4. 광고주 결제 테이블 (campaign_payments)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 결제 금액 상세
  recruit_count INTEGER NOT NULL,                  -- 총 모집 인원
  reward_point_total INTEGER NOT NULL,             -- 리뷰어 지급 포인트 총액
  agency_fee_total INTEGER NOT NULL,               -- 대행 수수료 총액
  supply_price INTEGER NOT NULL,                   -- 공급가액
  vat_amount INTEGER NOT NULL,                     -- 부가세
  total_amount INTEGER NOT NULL,                   -- 최종 결제 금액

  -- 결제 정보
  payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
  payment_status payment_status NOT NULL DEFAULT 'pending',

  -- 세금계산서 정보
  tax_invoice_number VARCHAR(50),                  -- 세금계산서 번호
  tax_invoice_issued_at TIMESTAMPTZ,               -- 발행일
  tax_invoice_email VARCHAR(255),                  -- 발송 이메일

  -- PG 결제 정보 (카드 결제 시)
  pg_provider VARCHAR(50),                         -- PG사 (toss, nice 등)
  pg_transaction_id VARCHAR(100),                  -- PG 거래 ID
  pg_approved_at TIMESTAMPTZ,                      -- PG 승인 시간

  -- 가상계좌 정보 (무통장 입금 시)
  virtual_bank_name VARCHAR(50),                   -- 가상계좌 은행명
  virtual_account_number VARCHAR(50),              -- 가상계좌 번호
  virtual_account_holder VARCHAR(50),              -- 예금주
  virtual_account_due_date TIMESTAMPTZ,            -- 입금 기한

  paid_at TIMESTAMPTZ,                             -- 실제 결제/입금 완료 시간
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_payments_campaign ON campaign_payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_payments_client ON campaign_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_payments_status ON campaign_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_campaign_payments_created ON campaign_payments(created_at);


-- 5. 리뷰어 세무 정보 테이블 (reviewer_tax_info)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS reviewer_tax_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 암호화된 주민등록번호 (AES-256)
  encrypted_rrn TEXT NOT NULL,                     -- 암호화된 주민번호
  rrn_hash VARCHAR(64) NOT NULL,                   -- 중복 체크용 해시 (SHA-256)

  -- 실명 정보
  legal_name VARCHAR(50) NOT NULL,                 -- 법적 실명

  -- 세무 정보 등록 상태
  verified_at TIMESTAMPTZ,                         -- 본인인증 완료 시간
  verification_method VARCHAR(20),                 -- 'phone', 'ipin', 'pass' 등

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (해시 검색용)
CREATE INDEX IF NOT EXISTS idx_reviewer_tax_info_user ON reviewer_tax_info(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_tax_info_hash ON reviewer_tax_info(rrn_hash);


-- 6. withdrawal_requests 테이블 수정 (세금 정보 추가)
-- -----------------------------------------------------
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS gross_amount INTEGER;           -- 세전 금액 (신청액)
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS withholding_tax INTEGER;        -- 원천징수세액 (3.3%)
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS actual_payout INTEGER;          -- 실수령액

-- 기존 데이터 마이그레이션: gross_amount = amount, withholding_tax = fee, actual_payout = net_amount
UPDATE withdrawal_requests
SET gross_amount = amount,
    withholding_tax = fee,
    actual_payout = net_amount
WHERE gross_amount IS NULL;

-- 세무 신고용 추가 정보
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS tax_reported BOOLEAN DEFAULT FALSE;  -- 세무 신고 완료 여부
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS tax_reported_at TIMESTAMPTZ;         -- 신고 처리 일시
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS tax_report_period VARCHAR(10);       -- 신고 귀속 기간 (2024-01 형식)


-- 7. 정산 리포트용 뷰 생성
-- -----------------------------------------------------

-- 7-1. 매출 리포트 뷰 (플랫폼 대행 수수료)
CREATE OR REPLACE VIEW v_revenue_report AS
SELECT
  DATE_TRUNC('month', cp.paid_at) AS report_month,
  COUNT(DISTINCT cp.campaign_id) AS campaign_count,
  SUM(cp.agency_fee_total) AS total_agency_fee,
  SUM(cp.total_amount) AS total_billing,
  SUM(cp.vat_amount) AS total_vat
FROM campaign_payments cp
WHERE cp.payment_status = 'paid'
GROUP BY DATE_TRUNC('month', cp.paid_at)
ORDER BY report_month DESC;

-- 7-2. 매입(비용) 리포트 뷰 (리뷰어 지급 포인트)
CREATE OR REPLACE VIEW v_payout_report AS
SELECT
  DATE_TRUNC('month', wr.completed_at) AS report_month,
  COUNT(*) AS payout_count,
  SUM(wr.gross_amount) AS total_gross_amount,
  SUM(wr.withholding_tax) AS total_withholding_tax,
  SUM(wr.actual_payout) AS total_actual_payout
FROM withdrawal_requests wr
WHERE wr.status = 'completed'
GROUP BY DATE_TRUNC('month', wr.completed_at)
ORDER BY report_month DESC;

-- 7-3. 원천세 신고 데이터 뷰 (월별 출금 완료 유저)
CREATE OR REPLACE VIEW v_withholding_tax_report AS
SELECT
  TO_CHAR(wr.completed_at, 'YYYY-MM') AS report_period,
  rp.name AS reviewer_name,
  rti.encrypted_rrn,
  rti.legal_name,
  wr.gross_amount,
  wr.withholding_tax,
  wr.actual_payout,
  wr.completed_at,
  wr.tax_reported,
  wr.id AS withdrawal_id,
  wr.reviewer_id
FROM withdrawal_requests wr
JOIN reviewer_profiles rp ON wr.reviewer_id = rp.user_id
LEFT JOIN reviewer_tax_info rti ON wr.reviewer_id = rti.user_id
WHERE wr.status = 'completed'
ORDER BY wr.completed_at DESC;


-- 8. RLS 정책 설정
-- -----------------------------------------------------

-- campaign_payments RLS
ALTER TABLE campaign_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all payments" ON campaign_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients can view own payments" ON campaign_payments
  FOR SELECT USING (client_id = auth.uid());


-- reviewer_tax_info RLS
ALTER TABLE reviewer_tax_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tax info" ON reviewer_tax_info
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tax info" ON reviewer_tax_info
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );


-- 9. 트리거: updated_at 자동 갱신
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_campaign_payments_updated_at ON campaign_payments;
CREATE TRIGGER update_campaign_payments_updated_at
  BEFORE UPDATE ON campaign_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviewer_tax_info_updated_at ON reviewer_tax_info;
CREATE TRIGGER update_reviewer_tax_info_updated_at
  BEFORE UPDATE ON reviewer_tax_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 10. 함수: 캠페인 결제 금액 계산
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_campaign_billing(
  p_recruit_count INTEGER,
  p_reward_point INTEGER,
  p_agency_fee_per_person INTEGER DEFAULT 3000
)
RETURNS TABLE (
  recruit_count INTEGER,
  reward_point_total INTEGER,
  agency_fee_total INTEGER,
  supply_price INTEGER,
  vat_amount INTEGER,
  total_amount INTEGER
) AS $$
DECLARE
  v_reward_total INTEGER;
  v_fee_total INTEGER;
  v_supply INTEGER;
  v_vat INTEGER;
  v_total INTEGER;
BEGIN
  v_reward_total := p_recruit_count * p_reward_point;
  v_fee_total := p_recruit_count * p_agency_fee_per_person;
  v_supply := v_reward_total + v_fee_total;
  v_vat := FLOOR(v_supply * 0.1);
  v_total := v_supply + v_vat;

  RETURN QUERY SELECT
    p_recruit_count,
    v_reward_total,
    v_fee_total,
    v_supply,
    v_vat,
    v_total;
END;
$$ LANGUAGE plpgsql;


-- 11. 함수: 출금 실수령액 계산
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_payout(
  p_gross_amount INTEGER,
  p_tax_rate NUMERIC DEFAULT 0.033
)
RETURNS TABLE (
  gross_amount INTEGER,
  withholding_tax INTEGER,
  actual_payout INTEGER
) AS $$
DECLARE
  v_tax INTEGER;
  v_payout INTEGER;
BEGIN
  v_tax := FLOOR(p_gross_amount * p_tax_rate);
  v_payout := p_gross_amount - v_tax;

  RETURN QUERY SELECT
    p_gross_amount,
    v_tax,
    v_payout;
END;
$$ LANGUAGE plpgsql;


-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '결제 및 정산 시스템 마이그레이션 완료';
END $$;
