import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
  console.log('=== 결제/정산 테이블 확인 ===\n')

  // 1. campaign_payments 테이블
  const { data: cp, error: cpErr } = await supabase
    .from('campaign_payments')
    .select('id')
    .limit(1)
  console.log('1. campaign_payments:', cpErr ? '❌ ' + cpErr.message : '✅ OK')

  // 2. reviewer_tax_info 테이블
  const { data: rti, error: rtiErr } = await supabase
    .from('reviewer_tax_info')
    .select('id')
    .limit(1)
  console.log('2. reviewer_tax_info:', rtiErr ? '❌ ' + rtiErr.message : '✅ OK')

  // 3. settings 확인
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['agency_fee_per_person', 'withholding_tax_rate', 'min_withdrawal_amount', 'withdrawal_fee'])

  console.log('\n=== 설정값 ===')
  if (settings && settings.length > 0) {
    settings.forEach(s => console.log(`   ${s.key}: ${s.value}`))
  } else {
    console.log('   ❌ 설정값 없음')
  }

  // 4. campaigns 컬럼 확인
  const { data: camp, error: campErr } = await supabase
    .from('campaigns')
    .select('id, agency_fee_per_person, supply_price, vat_amount, total_billing_amount')
    .limit(1)
  console.log('\n=== campaigns 새 컬럼 ===')
  if (campErr) {
    console.log('   ❌', campErr.message)
  } else {
    console.log('   ✅ agency_fee_per_person, supply_price, vat_amount, total_billing_amount 확인됨')
  }

  // 5. withdrawal_requests 컬럼 확인
  const { data: wr, error: wrErr } = await supabase
    .from('withdrawal_requests')
    .select('id, gross_amount, withholding_tax, actual_payout, tax_reported')
    .limit(1)
  console.log('\n=== withdrawal_requests 새 컬럼 ===')
  if (wrErr) {
    console.log('   ❌', wrErr.message)
  } else {
    console.log('   ✅ gross_amount, withholding_tax, actual_payout, tax_reported 확인됨')
  }

  // 6. 뷰 확인
  console.log('\n=== 리포트 뷰 ===')

  const { error: v1Err } = await supabase.from('v_revenue_report').select('*').limit(1)
  console.log('   v_revenue_report:', v1Err ? '❌ ' + v1Err.code : '✅ OK')

  const { error: v2Err } = await supabase.from('v_payout_report').select('*').limit(1)
  console.log('   v_payout_report:', v2Err ? '❌ ' + v2Err.code : '✅ OK')

  const { error: v3Err } = await supabase.from('v_withholding_tax_report').select('*').limit(1)
  console.log('   v_withholding_tax_report:', v3Err ? '❌ ' + v3Err.code : '✅ OK')

  // 7. DB 함수 테스트
  console.log('\n=== DB 함수 테스트 ===')

  const { data: billing, error: billErr } = await supabase
    .rpc('calculate_campaign_billing', {
      p_recruit_count: 10,
      p_reward_point: 30000,
      p_agency_fee_per_person: 3000
    })

  if (billErr) {
    console.log('   calculate_campaign_billing: ❌', billErr.message)
  } else if (billing && billing.length > 0) {
    const b = billing[0]
    console.log('   calculate_campaign_billing: ✅')
    console.log(`      모집인원: ${b.recruit_count}명`)
    console.log(`      리뷰어 지급: ${b.reward_point_total.toLocaleString()}원`)
    console.log(`      대행수수료: ${b.agency_fee_total.toLocaleString()}원`)
    console.log(`      공급가액: ${b.supply_price.toLocaleString()}원`)
    console.log(`      부가세: ${b.vat_amount.toLocaleString()}원`)
    console.log(`      총 결제액: ${b.total_amount.toLocaleString()}원`)
  }

  const { data: payout, error: payErr } = await supabase
    .rpc('calculate_payout', {
      p_gross_amount: 100000
    })

  if (payErr) {
    console.log('   calculate_payout: ❌', payErr.message)
  } else if (payout && payout.length > 0) {
    const p = payout[0]
    console.log('   calculate_payout: ✅')
    console.log(`      신청금액: ${p.gross_amount.toLocaleString()}원`)
    console.log(`      원천징수(3.3%): ${p.withholding_tax.toLocaleString()}원`)
    console.log(`      실수령액: ${p.actual_payout.toLocaleString()}원`)
  }

  console.log('\n✨ 마이그레이션 검증 완료!')
}

check().catch(console.error)
