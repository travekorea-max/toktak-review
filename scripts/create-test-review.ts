import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function createTestReview() {
  console.log('📝 리뷰 제출 테스트 데이터 생성 중...\n')

  // 승인된 구매 인증 가져오기
  const { data: verifications, error: fetchError } = await supabase
    .from('purchase_verifications')
    .select('id, application_id, platform')
    .eq('status', 'approved')

  if (fetchError) {
    console.log('❌ 조회 오류:', fetchError.message)
    return
  }

  if (!verifications || verifications.length === 0) {
    console.log('❌ 승인된 구매 인증이 없습니다')
    return
  }

  console.log(`📋 승인된 구매 인증 ${verifications.length}건 발견\n`)

  const reviewUrls = [
    'https://shopping.naver.com/review/12345678',
    'https://www.coupang.com/review/87654321',
    'https://shopping.naver.com/review/11223344',
  ]

  for (let i = 0; i < verifications.length; i++) {
    const v = verifications[i]
    console.log(`📌 구매인증 ID: ${v.id.substring(0, 8)}...`)

    // 이미 리뷰가 있는지 확인
    const { data: existing } = await supabase
      .from('review_submissions')
      .select('id')
      .eq('application_id', v.application_id)
      .single()

    if (existing) {
      console.log('   ⚠️  이미 리뷰 존재')
      continue
    }

    const { error } = await supabase
      .from('review_submissions')
      .insert({
        application_id: v.application_id,
        review_url: reviewUrls[i] || `https://review.example.com/${i}`,
        image_url: 'https://via.placeholder.com/400x600?text=Review+Screenshot',
        platform: v.platform,
        status: 'pending', // 검수 대기
      })

    if (error) {
      console.log(`   ❌ 오류: ${error.message}`)
    } else {
      console.log(`   ✅ 리뷰 제출 생성 (검수 대기)`)
    }
  }

  // 결과 확인
  console.log('\n📋 리뷰 제출 현황:')
  const { data: reviews } = await supabase
    .from('review_submissions')
    .select('id, review_url, platform, status')
    .order('created_at', { ascending: false })

  reviews?.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.status}] ${r.platform} - ${r.review_url}`)
  })

  console.log('\n✨ 완료!')
  console.log('   - 관리자 페이지에서 리뷰 검수 가능')
  console.log('   - /admin/reviews 에서 승인/반려 처리')
}

createTestReview().catch(console.error)
