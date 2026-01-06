import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function runMigration() {
  console.log('🚀 Dual Pricing 마이그레이션 실행 중...\n')

  // 1. 카드 가산율 설정 추가
  console.log('1. 카드 가산율 설정 추가...')
  const { error: settingsError } = await supabase
    .from('settings')
    .upsert({
      key: 'card_surcharge_rate',
      value: '0.035',
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (settingsError) {
    console.log('   ❌', settingsError.message)
  } else {
    console.log('   ✅ card_surcharge_rate: 0.035 설정됨')
  }

  // 2-4는 DDL이라 REST API로 안됨, SQL 직접 실행 필요
  // Supabase JS는 DDL 지원 안함 - Dashboard에서 실행 필요

  console.log('\n⚠️  ALTER TABLE 명령은 Supabase Dashboard SQL Editor에서 실행해야 합니다.')
  console.log('\n다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:\n')

  const sql = `
-- campaign_payments 테이블에 Dual Pricing 컬럼 추가
ALTER TABLE campaign_payments ADD COLUMN IF NOT EXISTS base_amount INTEGER DEFAULT 0;
ALTER TABLE campaign_payments ADD COLUMN IF NOT EXISTS surcharge_amount INTEGER DEFAULT 0;
ALTER TABLE campaign_payments ADD COLUMN IF NOT EXISTS surcharge_rate NUMERIC(5,4) DEFAULT 0;

-- 기존 데이터 마이그레이션
UPDATE campaign_payments
SET base_amount = reward_point_total + agency_fee_total,
    surcharge_amount = 0,
    surcharge_rate = 0
WHERE base_amount = 0 OR base_amount IS NULL;

-- DB 함수: 결제 수단별 금액 계산 v2
CREATE OR REPLACE FUNCTION calculate_campaign_billing_v2(
  p_recruit_count INTEGER,
  p_reward_point INTEGER,
  p_agency_fee_per_person INTEGER DEFAULT 3000,
  p_payment_method TEXT DEFAULT 'bank_transfer',
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
  v_reward_total := p_recruit_count * p_reward_point;
  v_fee_total := p_recruit_count * p_agency_fee_per_person;
  v_base := v_reward_total + v_fee_total;

  IF p_payment_method = 'credit_card' THEN
    v_surcharge_rate := p_card_surcharge_rate;
    v_surcharge := FLOOR(v_base * v_surcharge_rate);
  ELSE
    v_surcharge_rate := 0;
    v_surcharge := 0;
  END IF;

  v_supply := v_base + v_surcharge;
  v_vat := FLOOR(v_supply * 0.1);
  v_total := v_supply + v_vat;

  RETURN QUERY SELECT
    p_recruit_count, v_reward_total, v_fee_total, v_base,
    v_surcharge_rate, v_surcharge, v_supply, v_vat, v_total,
    p_payment_method;
END;
$$ LANGUAGE plpgsql;
`

  console.log(sql)

  // 현재 설정 확인
  console.log('\n📋 현재 설정값 확인:')
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['agency_fee_per_person', 'card_surcharge_rate', 'withholding_tax_rate'])

  settings?.forEach(s => {
    console.log(`   ${s.key}: ${s.value}`)
  })
}

runMigration().catch(console.error)
