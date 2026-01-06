import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setupContentTest() {
  console.log('=== 2차 활용 콘텐츠 테스트 데이터 설정 ===\n')

  const campaignId = 'e6b5ac29-7f9c-48dd-a13d-a6053a3261e2'

  // 기존 리뷰를 승인 상태로 업데이트
  console.log('1. 리뷰 승인 처리 중...')

  const { data: apps } = await supabase
    .from('applications')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('status', 'selected')

  if (!apps || apps.length === 0) {
    console.log('❌ 선정된 신청자가 없습니다')
    return
  }

  // 모든 리뷰를 승인 상태로 변경
  const { data: reviews, error } = await supabase
    .from('review_submissions')
    .update({
      status: 'approved',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    })
    .in('application_id', apps.map(a => a.id))
    .select()

  if (error) {
    console.log('❌ 리뷰 업데이트 실패:', error.message)
    return
  }

  console.log('✅ 리뷰', reviews?.length || 0, '건 승인 처리 완료')

  // 리뷰 이미지 URL 다양하게 설정
  const imageUrls = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
  ]

  for (let i = 0; i < (reviews?.length || 0); i++) {
    await supabase
      .from('review_submissions')
      .update({ image_url: imageUrls[i % imageUrls.length] })
      .eq('id', reviews![i].id)
  }

  console.log('✅ 이미지 URL 설정 완료')

  // 최종 확인
  const { data: finalReviews } = await supabase
    .from('review_submissions')
    .select('id, status, review_url, image_url')
    .in('application_id', apps.map(a => a.id))
    .eq('status', 'approved')

  console.log('\n📊 2차 활용 가능한 콘텐츠:', finalReviews?.length || 0, '건')
  finalReviews?.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.review_url?.substring(0, 50)}...`)
  })

  console.log('\n=== 설정 완료 ===')
  console.log('\n📱 브라우저에서 확인:')
  console.log(`   http://localhost:3000/client/campaigns/${campaignId}/content`)
  console.log('\n   로그인: toktak.client@gmail.com / test1234!')
}

setupContentTest().catch(console.error)
