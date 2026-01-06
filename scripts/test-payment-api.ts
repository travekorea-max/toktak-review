import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testPaymentAPI() {
  console.log('=== 결제 API 테스트 ===\n')

  // 1. 광고주 ID 조회
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'toktak.client@gmail.com')
    .single()

  if (!user) {
    console.log('❌ 광고주 계정을 찾을 수 없습니다')
    return
  }

  console.log(`👤 광고주: ${user.email}`)
  console.log(`   ID: ${user.id}\n`)

  // 2. 결제 API 호출
  console.log('📤 결제 API 호출 중...')

  const response = await fetch('http://localhost:3000/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignId: '9ea55b06-6bea-4472-9b73-31154352a660',
      clientId: user.id,
      recruitCount: 20,
      rewardPointPerPerson: 15000,
      paymentMethod: 'bank_transfer',
      taxInvoiceEmail: 'tax@example.com'
    })
  })

  const result = await response.json()

  if (result.error) {
    console.log(`❌ 에러: ${result.error}`)
    return
  }

  console.log('\n✅ 결제 생성 성공!')
  console.log(`   결제 ID: ${result.payment.id}`)
  console.log(`   상태: ${result.payment.payment_status}`)
  console.log('\n💰 정산 내역:')
  console.log(`   모집인원: ${result.billing.recruitCount}명`)
  console.log(`   리뷰어 포인트 합계: ${result.billing.rewardPointTotal.toLocaleString()}원`)
  console.log(`   수수료 합계: ${result.billing.agencyFeeTotal.toLocaleString()}원`)
  console.log(`   기본금액: ${result.billing.baseAmount.toLocaleString()}원`)
  console.log(`   공급가액: ${result.billing.supplyPrice.toLocaleString()}원`)
  console.log(`   부가세: ${result.billing.vatAmount.toLocaleString()}원`)
  console.log(`   총액: ${result.billing.totalAmount.toLocaleString()}원`)

  if (result.billing.discountMessage) {
    console.log(`\n🎁 ${result.billing.discountMessage}`)
  }

  // 3. 결제 조회 확인
  console.log('\n📋 생성된 결제 확인...')
  const { data: payment } = await supabase
    .from('campaign_payments')
    .select('*')
    .eq('id', result.payment.id)
    .single()

  if (payment) {
    console.log('✅ DB에 결제 정보 저장됨')
    console.log(`   가상계좌: ${payment.virtual_bank_name} ${payment.virtual_account_number}`)
  }
}

testPaymentAPI().catch(console.error)
