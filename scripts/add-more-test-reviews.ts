import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addMoreTestData() {
  console.log('=== 추가 테스트 데이터 생성 ===\n')

  const campaignId = 'e6b5ac29-7f9c-48dd-a13d-a6053a3261e2'

  // 리뷰어 목록 조회
  const { data: reviewers } = await supabase
    .from('reviewer_profiles')
    .select('user_id, name')
    .limit(10)

  if (!reviewers || reviewers.length < 3) {
    console.log('❌ 충분한 리뷰어가 없습니다')
    return
  }

  // 기존 신청자 ID 확인
  const { data: existingApps } = await supabase
    .from('applications')
    .select('reviewer_id')
    .eq('campaign_id', campaignId)

  const existingReviewerIds = existingApps?.map(a => a.reviewer_id) || []

  // 새 신청자 추가
  const newReviewers = reviewers.filter(r => !existingReviewerIds.includes(r.user_id))

  console.log('1. 추가 신청자 생성...')
  for (let i = 0; i < Math.min(newReviewers.length, 5); i++) {
    const reviewer = newReviewers[i]
    const statuses = ['selected', 'selected', 'selected', 'applied', 'rejected']
    const platforms = ['naver', 'coupang', 'naver', 'coupang', 'naver']

    await supabase
      .from('applications')
      .insert({
        campaign_id: campaignId,
        reviewer_id: reviewer.user_id,
        platform: platforms[i],
        status: statuses[i],
      })
    console.log(`   ✅ ${reviewer.name} - ${statuses[i]}`)
  }

  // 선정된 신청자에 리뷰 추가
  console.log('\n2. 추가 리뷰 생성...')

  const { data: selectedApps } = await supabase
    .from('applications')
    .select('id, platform, reviewer_id')
    .eq('campaign_id', campaignId)
    .eq('status', 'selected')

  if (!selectedApps) return

  // 기존 리뷰 확인
  const { data: existingReviews } = await supabase
    .from('review_submissions')
    .select('application_id')
    .in('application_id', selectedApps.map(a => a.id))

  const existingAppIds = existingReviews?.map(r => r.application_id) || []
  const appsWithoutReview = selectedApps.filter(a => !existingAppIds.includes(a.id))

  const reviewStatuses = ['approved', 'approved', 'pending', 'revision_requested', 'rejected']
  const reviewUrls = [
    'https://blog.naver.com/reviewer1/12345',
    'https://blog.naver.com/reviewer2/67890',
    'https://www.coupang.com/vp/products/review/11111',
    'https://blog.naver.com/reviewer3/22222',
    'https://www.coupang.com/vp/products/review/33333',
  ]

  for (let i = 0; i < appsWithoutReview.length; i++) {
    const app = appsWithoutReview[i]
    await supabase
      .from('review_submissions')
      .insert({
        application_id: app.id,
        review_url: reviewUrls[i % 5],
        image_url: 'https://example.com/screenshot.jpg',
        platform: app.platform,
        status: reviewStatuses[i % 5],
      })
    console.log(`   ✅ 리뷰 추가 - ${reviewStatuses[i % 5]}`)
  }

  // 최종 통계
  console.log('\n3. 최종 통계...')

  const { data: finalApps } = await supabase
    .from('applications')
    .select('id, status')
    .eq('campaign_id', campaignId)

  const { data: finalReviews } = await supabase
    .from('review_submissions')
    .select('id, status')
    .in('application_id', finalApps?.map(a => a.id) || [])

  console.log('   총 지원자:', finalApps?.length || 0, '명')
  console.log('   - 선정:', finalApps?.filter(a => a.status === 'selected').length || 0, '명')
  console.log('   - 미선정:', finalApps?.filter(a => a.status === 'rejected').length || 0, '명')
  console.log('   - 검토중:', finalApps?.filter(a => a.status === 'applied').length || 0, '명')
  console.log('')
  console.log('   제출 리뷰:', finalReviews?.length || 0, '건')
  console.log('   - 승인:', finalReviews?.filter(r => r.status === 'approved').length || 0, '건')
  console.log('   - 검토중:', finalReviews?.filter(r => ['pending', 'ai_passed', 'needs_review'].includes(r.status)).length || 0, '건')
  console.log('   - 수정요청:', finalReviews?.filter(r => r.status === 'revision_requested').length || 0, '건')
  console.log('   - 반려:', finalReviews?.filter(r => r.status === 'rejected').length || 0, '건')

  console.log('\n=== 완료 ===')
  console.log('브라우저를 새로고침하여 결과 보고서를 확인하세요.')
}

addMoreTestData().catch(console.error)
