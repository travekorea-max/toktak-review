import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  console.log('=== 입금 시뮬레이션 결과 확인 ===\n')

  // 결제 상태 확인
  const { data: payment } = await supabase
    .from('campaign_payments')
    .select('id, payment_status, paid_at, total_amount, campaign_id')
    .eq('id', 'aa60dc3b-0d71-4e79-8e80-f0672df9c108')
    .single()

  if (payment) {
    const statusEmoji = payment.payment_status === 'paid' ? '✅' : '⏳'
    console.log(`${statusEmoji} 결제 상태: ${payment.payment_status}`)
    console.log(`   결제 금액: ${payment.total_amount.toLocaleString()}원`)
    if (payment.paid_at) {
      console.log(`   결제 완료일: ${new Date(payment.paid_at).toLocaleString('ko-KR')}`)
    }

    // 캠페인 상태 확인
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, title, status')
      .eq('id', payment.campaign_id)
      .single()

    if (campaign) {
      const campStatusEmoji = campaign.status === 'recruiting' ? '🟢' : '🟡'
      console.log(`\n${campStatusEmoji} 캠페인 상태: ${campaign.status}`)
      console.log(`   캠페인: ${campaign.title}`)
    }
  }

  // 전체 결제 통계
  const { data: allPayments } = await supabase
    .from('campaign_payments')
    .select('payment_status, total_amount')

  if (allPayments) {
    const pending = allPayments.filter(p => p.payment_status === 'pending')
    const paid = allPayments.filter(p => p.payment_status === 'paid')
    const totalPaid = paid.reduce((sum, p) => sum + p.total_amount, 0)

    console.log('\n=== 전체 결제 현황 ===')
    console.log(`입금 대기: ${pending.length}건`)
    console.log(`결제 완료: ${paid.length}건 (${totalPaid.toLocaleString()}원)`)
  }
}

check().catch(console.error)
