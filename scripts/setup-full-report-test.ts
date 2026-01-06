import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setupFullTestData() {
  console.log('=== 결과 보고서 전체 테스트 데이터 설정 ===\n')

  const campaignId = 'e6b5ac29-7f9c-48dd-a13d-a6053a3261e2'

  // 1. 캠페인 확인
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    console.log('❌ 캠페인을 찾을 수 없습니다')
    return
  }
  console.log('✅ 캠페인:', campaign.title)

  // 2. 기존 데이터 정리
  console.log('\n기존 데이터 정리 중...')

  const { data: oldApps } = await supabase
    .from('applications')
    .select('id')
    .eq('campaign_id', campaignId)

  if (oldApps && oldApps.length > 0) {
    await supabase
      .from('review_submissions')
      .delete()
      .in('application_id', oldApps.map(a => a.id))

    await supabase
      .from('applications')
      .delete()
      .eq('campaign_id', campaignId)
  }
  console.log('✅ 기존 데이터 삭제 완료')

  // 3. 테스트 리뷰어 생성 (5명)
  console.log('\n테스트 리뷰어 생성 중...')

  const testReviewers = []
  const reviewerNames = ['김리뷰', '이체험', '박블로그', '최네이버', '정쿠팡']

  for (let i = 0; i < 5; i++) {
    const reviewerId = randomUUID()

    // users 테이블에 추가
    await supabase.from('users').insert({
      id: reviewerId,
      email: `test.reviewer${i + 1}@example.com`,
      role: 'reviewer',
      status: 'active',
    })

    // reviewer_profiles 테이블에 추가
    await supabase.from('reviewer_profiles').insert({
      user_id: reviewerId,
      name: reviewerNames[i],
      phone: `010-${1000 + i}-${5000 + i}`,
      naver_id: `reviewer${i + 1}`,
      coupang_id: `coupang_reviewer${i + 1}`,
      rating: 4.0 + (i * 0.2),
      point_balance: 10000 * (i + 1),
    })

    testReviewers.push({ id: reviewerId, name: reviewerNames[i] })
    console.log(`   ✅ ${reviewerNames[i]} 생성`)
  }

  // 4. 신청자 생성
  console.log('\n신청자 데이터 생성 중...')

  const applicationData = [
    { reviewerIdx: 0, status: 'selected', platform: 'naver' },
    { reviewerIdx: 1, status: 'selected', platform: 'naver' },
    { reviewerIdx: 2, status: 'selected', platform: 'naver' },
    { reviewerIdx: 3, status: 'applied', platform: 'naver' },
    { reviewerIdx: 4, status: 'rejected', platform: 'naver' },
  ]

  const createdApps = []
  for (const appData of applicationData) {
    const { data: app } = await supabase
      .from('applications')
      .insert({
        campaign_id: campaignId,
        reviewer_id: testReviewers[appData.reviewerIdx].id,
        platform: appData.platform,
        status: appData.status,
      })
      .select()
      .single()

    if (app) {
      createdApps.push({ ...app, name: testReviewers[appData.reviewerIdx].name })
      console.log(`   ✅ ${testReviewers[appData.reviewerIdx].name}: ${appData.status}`)
    }
  }

  // 5. 리뷰 생성 (선정된 신청자만)
  console.log('\n리뷰 데이터 생성 중...')

  const selectedApps = createdApps.filter(a => a.status === 'selected')
  const reviewData = [
    { status: 'approved', url: 'https://blog.naver.com/kimreview/123456789' },
    { status: 'pending', url: 'https://blog.naver.com/leereview/234567890' },
    { status: 'revision_requested', url: 'https://blog.naver.com/parkreview/345678901' },
  ]

  for (let i = 0; i < selectedApps.length; i++) {
    await supabase.from('review_submissions').insert({
      application_id: selectedApps[i].id,
      review_url: reviewData[i].url,
      image_url: 'https://example.com/screenshot.jpg',
      platform: 'naver',
      status: reviewData[i].status,
    })
    console.log(`   ✅ ${selectedApps[i].name}: ${reviewData[i].status}`)
  }

  // 6. 최종 통계
  console.log('\n=== 최종 데이터 확인 ===')

  const { data: finalApps } = await supabase
    .from('applications')
    .select('id, status')
    .eq('campaign_id', campaignId)

  const { data: finalReviews } = await supabase
    .from('review_submissions')
    .select('id, status')
    .in('application_id', finalApps?.map(a => a.id) || [])

  const totalRecruit = campaign.recruit_count_naver + campaign.recruit_count_coupang
  const totalApps = finalApps?.length || 0
  const selectedCount = finalApps?.filter(a => a.status === 'selected').length || 0
  const reviewCount = finalReviews?.length || 0
  const approvedCount = finalReviews?.filter(r => r.status === 'approved').length || 0

  console.log('\n📊 통계:')
  console.log(`   목표 인원: ${totalRecruit}명`)
  console.log(`   총 지원자: ${totalApps}명 (지원율: ${Math.round(totalApps / totalRecruit * 100)}%)`)
  console.log(`   선정 인원: ${selectedCount}명 (선정률: ${Math.round(selectedCount / totalApps * 100)}%)`)
  console.log(`   제출 리뷰: ${reviewCount}건 (제출률: ${Math.round(reviewCount / selectedCount * 100)}%)`)
  console.log(`   승인 리뷰: ${approvedCount}건 (승인률: ${Math.round(approvedCount / reviewCount * 100)}%)`)

  console.log('\n=== 설정 완료 ===')
  console.log('\n📱 브라우저에서 확인:')
  console.log(`   http://localhost:3000/client/campaigns/${campaignId}/report`)
  console.log('\n   로그인: toktak.client@gmail.com / test1234!')
}

setupFullTestData().catch(console.error)
