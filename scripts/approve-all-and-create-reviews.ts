import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function run() {
  console.log('🔧 모든 구매 인증 승인 중...\n')

  // pending 구매 인증 모두 승인
  const { error: updateError } = await supabase
    .from('purchase_verifications')
    .update({ status: 'approved', verified_at: new Date().toISOString() })
    .eq('status', 'pending')

  if (updateError) {
    console.log('❌ 승인 오류:', updateError.message)
  } else {
    console.log('✅ 구매 인증 모두 승인 완료')
  }

  // 승인된 구매 인증 확인
  const { data: verifications } = await supabase
    .from('purchase_verifications')
    .select('id, application_id, platform, status')

  console.log('\n📋 구매 인증 현황:')
  verifications?.forEach((v, i) => {
    console.log(`  ${i + 1}. [${v.status}] ${v.platform}`)
  })

  // 리뷰가 없는 신청에 대해 리뷰 생성
  console.log('\n📝 추가 리뷰 생성 중...\n')

  const reviewUrls = [
    'https://www.coupang.com/review/87654321',
    'https://shopping.naver.com/review/11112222',
    'https://shopping.naver.com/review/33334444',
  ]

  let created = 0
  for (let i = 0; i < (verifications?.length || 0); i++) {
    const v = verifications![i]

    // 이미 리뷰가 있는지 확인
    const { data: existing } = await supabase
      .from('review_submissions')
      .select('id')
      .eq('application_id', v.application_id)
      .single()

    if (existing) continue

    const { error } = await supabase
      .from('review_submissions')
      .insert({
        application_id: v.application_id,
        review_url: reviewUrls[i] || `https://review.example.com/${i}`,
        image_url: 'https://via.placeholder.com/400x600?text=Review+Screenshot',
        platform: v.platform,
        status: 'pending',
      })

    if (!error) {
      created++
      console.log(`  ✅ 리뷰 생성: ${v.platform}`)
    }
  }

  console.log(`\n추가 생성된 리뷰: ${created}건`)

  // 최종 현황
  console.log('\n📋 리뷰 제출 전체 현황:')
  const { data: reviews } = await supabase
    .from('review_submissions')
    .select('platform, status, review_url')
    .order('created_at', { ascending: false })

  reviews?.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.status}] ${r.platform} - ${r.review_url}`)
  })

  console.log('\n✨ 완료!')
}

run().catch(console.error)
