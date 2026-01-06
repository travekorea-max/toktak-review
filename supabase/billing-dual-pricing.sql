-- =====================================================
-- Dual Pricing 시스템 마이그레이션
-- 결제 수단별 차등 가격 정책 (카드 3.5% 가산)
-- =====================================================

-- 1. 카드 가산율 설정 추가
-- -----------------------------------------------------
INSERT INTO settings (key, value, updated_at) VALUES
  ('card_surcharge_rate', '0.035', NOW())
ON CONFLICT (key) DO NOTHING;


-- 2. campaign_payments 테이블에 Dual Pricing 컬럼 추가
-- -----------------------------------------------------
-- base_amount: 수수료 포함 전, 순수 원가 합계 (P+F)*N
ALTER TABLE campaign_payments ADD COLUMN IF NOT EXISTS base_amount INTEGER DEFAULT 0;

-- surcharge_amount: 카드 결제로 인해 추가된 금액 (무통장이면 0)
ALTER TABLE campaign_payments ADD COLUMN IF NOT EXISTS surcharge_amount INTEGER DEFAULT 0;

-- surcharge_rate: 적용된 가산율 (카드: 0.035, 무통장: 0)
ALTER TABLE campaign_payments ADD COLUMN IF NOT EXISTS surcharge_rate NUMERIC(5,4) DEFAULT 0;


-- 3. 기존 데이터 마이그레이션 (base_amount 계산)
-- -----------------------------------------------------
UPDATE campaign_payments
SET base_amount = reward_point_total + agency_fee_total,
    surcharge_amount = 0,
    surcharge_rate = 0
WHERE base_amount = 0 OR base_amount IS NULL;


-- 4. DB 함수 업데이트: 결제 수단별 금액 계산
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_campaign_billing_v2(
  p_recruit_count INTEGER,
  p_reward_point INTEGER,
  p_agency_fee_per_person INTEGER DEFAULT 3000,
  p_payment_method TEXT DEFAULT 'bank_transfer',  -- 'bank_transfer' | 'credit_card'
  p_card_surcharge_rate NUMERIC DEFAULT 0.035
)
RETURNS TABLE (
  recruit_count INTEGER,
  reward_point_total INTEGER,
  agency_fee_total INTEGER,
  base_amount INTEGER,
  surcharge_rate NUMERIC,
  surcharge_amount INTEGER,
  supply_price INTEGER,
  vat_amount INTEGER,
  total_amount INTEGER,
  payment_method TEXT
) AS $$
DECLARE
  v_reward_total INTEGER;
  v_fee_total INTEGER;
  v_base INTEGER;
  v_surcharge_rate NUMERIC;
  v_surcharge INTEGER;
  v_supply INTEGER;
  v_vat INTEGER;
  v_total INTEGER;
BEGIN
  -- 기본 금액 계산
  v_reward_total := p_recruit_count * p_reward_point;
  v_fee_total := p_recruit_count * p_agency_fee_per_person;
  v_base := v_reward_total + v_fee_total;

  -- 결제 수단별 가산금액 계산
  IF p_payment_method = 'credit_card' THEN
    v_surcharge_rate := p_card_surcharge_rate;
    v_surcharge := FLOOR(v_base * v_surcharge_rate);
  ELSE
    v_surcharge_rate := 0;
    v_surcharge := 0;
  END IF;

  -- 공급가액 = 기본금액 + 가산금액
  v_supply := v_base + v_surcharge;

  -- 부가세 = 공급가액 * 10%
  v_vat := FLOOR(v_supply * 0.1);

  -- 최종 결제 금액
  v_total := v_supply + v_vat;

  RETURN QUERY SELECT
    p_recruit_count,
    v_reward_total,
    v_fee_total,
    v_base,
    v_surcharge_rate,
    v_surcharge,
    v_supply,
    v_vat,
    v_total,
    p_payment_method;
END;
$$ LANGUAGE plpgsql;


-- 5. 기존 함수도 유지 (하위 호환성)
-- -----------------------------------------------------
-- calculate_campaign_billing은 그대로 두고, v2 함수 추가


-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Dual Pricing 마이그레이션 완료';
END $$;
