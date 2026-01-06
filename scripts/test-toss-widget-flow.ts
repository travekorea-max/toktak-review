import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!

async function testTossWidgetFlow() {
  console.log('=== 토스 위젯 결제 플로우 테스트 ===\n')

  // 1. 테스트용 결제 정보 생성
  console.log('1. 결제 정보 생성...')

  const { data: client } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'toktak.client@gmail.com')
    .single()

  if (!client) {
    console.log('❌ 광고주 계정을 찾을 수 없습니다')
    return
  }

  const campaignId = 'e50c045f-cf40-46b9-bad8-719f97d594d6'

  const { data: payment, error: paymentError } = await supabase
    .from('campaign_payments')
    .insert({
      campaign_id: campaignId,
      client_id: client.id,
      recruit_count: 25,
      reward_point_total: 375000,
      agency_fee_total: 75000,
      base_amount: 450000,
      surcharge_rate: 0.035,
      surcharge_amount: 15750,
      supply_price: 465750,
      vat_amount: 46575,
      total_amount: 512325,
      payment_method: 'bank_transfer',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (paymentError) {
    console.log('❌ 결제 생성 실패:', paymentError.message)
    return
  }

  console.log('   ✅ 결제 ID:', payment.id)
  console.log('   금액:', payment.total_amount.toLocaleString(), '원\n')

  // 2. 토스페이먼츠 결제 키 발급 (실제로는 위젯에서 처리)
  console.log('2. 토스 결제 요청 (실제로는 위젯에서 처리)...')

  const authHeader = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')

  // 가상계좌 발급으로 테스트
  const tossResponse = await fetch('https://api.tosspayments.com/v1/virtual-accounts', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: payment.total_amount,
      orderId: payment.id,
      orderName: '천연 수제 비누 세트 체험단 결제',
      customerName: '테스트광고주',
      bank: '04',
      validHours: 1,
    }),
  })

  const tossResult = await tossResponse.json()

  if (!tossResponse.ok) {
    console.log('❌ 토스 결제 요청 실패:', tossResult.message)
    // 실패한 결제 삭제
    await supabase.from('campaign_payments').delete().eq('id', payment.id)
    return
  }

  console.log('   ✅ 결제 키:', tossResult.paymentKey)
  console.log('   가상계좌:', tossResult.virtualAccount?.accountNumber)
  console.log('   은행:', tossResult.virtualAccount?.bankCode, '\n')

  // 3. 결제 승인 테스트 (가상계좌는 입금 후 승인되므로 시뮬레이션)
  console.log('3. 결제 확인 시뮬레이션...')

  // DB에 토스 결제키 저장
  await supabase
    .from('campaign_payments')
    .update({
      toss_payment_key: tossResult.paymentKey,
      virtual_bank_name: 'KB국민은행',
      virtual_account_number: tossResult.virtualAccount?.accountNumber,
      virtual_account_holder: '(주)톡톡리뷰',
    })
    .eq('id', payment.id)

  // 입금 확인 시뮬레이션 (웹훅 대신 직접 처리)
  const { error: confirmError } = await supabase
    .from('campaign_payments')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  if (confirmError) {
    console.log('❌ 결제 확인 실패:', confirmError.message)
    return
  }

  // 캠페인 활성화
  await supabase
    .from('campaigns')
    .update({ status: 'recruiting' })
    .eq('id', campaignId)
    .eq('status', 'pending')

  console.log('   ✅ 결제 완료 처리됨\n')

  // 4. 최종 확인
  console.log('4. 최종 상태 확인...')

  const { data: finalPayment } = await supabase
    .from('campaign_payments')
    .select('id, payment_status, total_amount, toss_payment_key')
    .eq('id', payment.id)
    .single()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('title, status')
    .eq('id', campaignId)
    .single()

  console.log('   결제 상태:', finalPayment?.payment_status === 'paid' ? '✅ 완료' : '❌ 미완료')
  console.log('   결제 금액:', finalPayment?.total_amount.toLocaleString(), '원')
  console.log('   캠페인:', campaign?.title)
  console.log('   캠페인 상태:', campaign?.status === 'recruiting' ? '🟢 모집중' : campaign?.status)

  console.log('\n=== 테스트 완료 ===')
  console.log('\n📱 브라우저에서 실제 토스 위젯 테스트:')
  console.log('   1. http://localhost:3000/auth/login 접속')
  console.log('   2. toktak.client@gmail.com / test1234! 로그인')
  console.log('   3. 캠페인 목록에서 결제 대기 캠페인 선택')
  console.log('   4. 토스 위젯에서 결제 수단 선택 후 결제')
}

testTossWidgetFlow().catch(console.error)
