import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function createTestPurchase() {
  console.log('📝 구매 인증 테스트 데이터 생성 중...\n')

  // 선정된 신청 가져오기
  const { data: apps, error: fetchError } = await supabase
    .from('applications')
    .select('id, platform, reviewer_id')
    .eq('status', 'selected')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.log('❌ 조회 오류:', fetchError.message)
    return
  }

  if (!apps || apps.length === 0) {
    console.log('❌ 선정된 신청이 없습니다')
    return
  }

  console.log(`📋 선정된 신청 ${apps.length}건 발견\n`)

  const orderNumbers = [
    '2026010512345678',
    '2026010587654321',
    '2026010511223344',
  ]

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i]
    console.log(`📌 신청 ID: ${app.id.substring(0, 8)}...`)

    // 이미 구매 인증이 있는지 확인
    const { data: existing } = await supabase
      .from('purchase_verifications')
      .select('id')
      .eq('application_id', app.id)
      .single()

    if (existing) {
      console.log('   ⚠️  이미 구매 인증 존재')
      continue
    }

    const { error } = await supabase
      .from('purchase_verifications')
      .insert({
        application_id: app.id,
        order_number: orderNumbers[i] || `202601050000000${i}`,
        image_url: 'https://via.placeholder.com/400x300?text=Purchase+Receipt',
        platform: app.platform,
        status: i === 0 ? 'approved' : 'pending', // 첫번째는 승인, 나머지는 대기
      })

    if (error) {
      console.log(`   ❌ 오류: ${error.message}`)
    } else {
      console.log(`   ✅ 구매 인증 생성 (${i === 0 ? '승인됨' : '대기중'})`)
    }
  }

  // 결과 확인
  console.log('\n📋 구매 인증 현황:')
  const { data: verifications } = await supabase
    .from('purchase_verifications')
    .select('id, order_number, platform, status')
    .order('created_at', { ascending: false })

  verifications?.forEach((v, i) => {
    console.log(`  ${i + 1}. [${v.status}] ${v.platform} - 주문번호: ${v.order_number}`)
  })

  console.log('\n✨ 완료!')
  console.log('   - 1건은 "approved" 상태 → 리뷰 작성 가능')
  console.log('   - 나머지는 "pending" 상태 → 관리자 승인 대기')
}

createTestPurchase().catch(console.error)
