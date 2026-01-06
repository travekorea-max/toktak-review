import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verify() {
  console.log('=== Dual Pricing 마이그레이션 검증 ===\n')

  // 1. 설정값 확인
  console.log('1. 설정값 확인')
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['agency_fee_per_person', 'card_surcharge_rate', 'withholding_tax_rate'])

  settings?.forEach(s => {
    console.log(`   ✅ ${s.key}: ${s.value}`)
  })

  // 2. campaign_payments 새 컬럼 확인
  console.log('\n2. campaign_payments 새 컬럼 확인')
  const { data: cp, error: cpErr } = await supabase
    .from('campaign_payments')
    .select('id, base_amount, surcharge_amount, surcharge_rate')
    .limit(1)

  if (cpErr) {
    console.log('   ❌', cpErr.message)
  } else {
    console.log('   ✅ base_amount, surcharge_amount, surcharge_rate 컬럼 존재')
  }

  // 3. DB 함수 테스트 - 무통장 입금
  console.log('\n3. DB 함수 테스트 (calculate_campaign_billing_v2)')

  const { data: bankResult, error: bankErr } = await supabase
    .rpc('calculate_campaign_billing_v2', {
      p_recruit_count: 10,
      p_reward_point: 30000,
      p_payment_method: 'bank_transfer'
    })

  if (bankErr) {
    console.log('   ❌ 무통장:', bankErr.message)
  } else if (bankResult && bankResult.length > 0) {
    const b = bankResult[0]
    console.log('   ✅ 무통장 입금:')
    console.log(`      기본금액: ${b.base_amount.toLocaleString()}원`)
    console.log(`      가산금액: ${b.surcharge_amount.toLocaleString()}원`)
    console.log(`      공급가액: ${b.supply_price.toLocaleString()}원`)
    console.log(`      부가세: ${b.vat_amount.toLocaleString()}원`)
    console.log(`      총액: ${b.total_amount.toLocaleString()}원`)
  }

  // 4. DB 함수 테스트 - 카드 결제
  const { data: cardResult, error: cardErr } = await supabase
    .rpc('calculate_campaign_billing_v2', {
      p_recruit_count: 10,
      p_reward_point: 30000,
      p_payment_method: 'credit_card'
    })

  if (cardErr) {
    console.log('   ❌ 카드:', cardErr.message)
  } else if (cardResult && cardResult.length > 0) {
    const c = cardResult[0]
    console.log('   ✅ 카드 결제:')
    console.log(`      기본금액: ${c.base_amount.toLocaleString()}원`)
    console.log(`      가산금액(3.5%): +${c.surcharge_amount.toLocaleString()}원`)
    console.log(`      공급가액: ${c.supply_price.toLocaleString()}원`)
    console.log(`      부가세: ${c.vat_amount.toLocaleString()}원`)
    console.log(`      총액: ${c.total_amount.toLocaleString()}원`)

    // 차액 계산
    if (bankResult && bankResult.length > 0) {
      const diff = c.total_amount - bankResult[0].total_amount
      console.log(`\n   💰 무통장 선택 시 ${diff.toLocaleString()}원 절약!`)
    }
  }

  console.log('\n✨ Dual Pricing 마이그레이션 검증 완료!')
}

verify().catch(console.error)
