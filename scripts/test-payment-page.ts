import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  console.log('=== 결제 테스트 준비 ===\n')

  // 1. 캠페인 조회
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title, platform, recruit_count_naver, recruit_count_coupang, review_fee_naver, review_fee_coupang, status, client_id')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('📋 캠페인 목록:')
  campaigns?.forEach((c, i) => {
    const total = (c.recruit_count_naver || 0) + (c.recruit_count_coupang || 0)
    console.log(`  ${i+1}. [${c.status}] ${c.title}`)
    console.log(`     ID: ${c.id}`)
    console.log(`     모집인원: ${total}명, 플랫폼: ${c.platform}`)
  })

  if (!campaigns || campaigns.length === 0) {
    console.log('\n❌ 캠페인이 없습니다. 먼저 캠페인을 생성해주세요.')
    return
  }

  const testCampaign = campaigns[0]
  console.log(`\n🎯 테스트 캠페인: ${testCampaign.title}`)

  // 2. 결제 URL 생성
  const paymentUrl = `http://localhost:3000/client/campaigns/${testCampaign.id}/payment`
  console.log(`\n💳 결제 페이지 URL:`)
  console.log(`   ${paymentUrl}`)

  // 3. 기존 결제 확인
  const { data: existingPayment } = await supabase
    .from('campaign_payments')
    .select('id, payment_status, total_amount')
    .eq('campaign_id', testCampaign.id)
    .single()

  if (existingPayment) {
    console.log(`\n⚠️  이미 결제 내역이 있습니다:`)
    console.log(`   상태: ${existingPayment.payment_status}`)
    console.log(`   금액: ${existingPayment.total_amount.toLocaleString()}원`)
  } else {
    console.log(`\n✅ 결제 가능 상태입니다.`)
  }

  // 4. 광고주 계정 확인
  const { data: client } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'client')
    .limit(1)
    .single()

  if (client) {
    console.log(`\n👤 광고주 계정:`)
    console.log(`   이메일: ${client.email}`)
  }

  console.log('\n=== 테스트 방법 ===')
  console.log('1. 광고주 계정으로 로그인')
  console.log(`2. 결제 페이지 접속: ${paymentUrl}`)
  console.log('3. 결제 수단 선택 후 결제 진행')
}

test().catch(console.error)
