import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testCampaignReport() {
  console.log('=== 캠페인 결과 보고서 테스트 ===\n')

  // 1. 테스트용 캠페인 찾기/생성
  console.log('1. 테스트 캠페인 확인...')

  const { data: client } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'toktak.client@gmail.com')
    .single()

  if (!client) {
    console.log('❌ 광고주 계정을 찾을 수 없습니다')
    return
  }

  // 기존 캠페인 조회
  let { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('client_id', client.id)
    .in('status', ['in_progress', 'reviewing', 'completed'])
    .limit(1)
    .single()

  // 없으면 테스트용으로 상태 변경
  if (!campaign) {
    console.log('   진행중 캠페인이 없어 테스트용으로 상태 변경...')

    const { data: pendingCampaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('client_id', client.id)
      .limit(1)
      .single()

    if (pendingCampaign) {
      await supabase
        .from('campaigns')
        .update({ status: 'in_progress' })
        .eq('id', pendingCampaign.id)

      campaign = { ...pendingCampaign, status: 'in_progress' }
    }
  }

  if (!campaign) {
    console.log('❌ 테스트할 캠페인을 찾을 수 없습니다')
    return
  }

  console.log('   ✅ 캠페인:', campaign.title)
  console.log('   상태:', campaign.status)
  console.log('   ID:', campaign.id, '\n')

  // 2. 테스트 신청자 데이터 생성
  console.log('2. 테스트 신청자 데이터 확인...')

  const { data: reviewers } = await supabase
    .from('reviewer_profiles')
    .select('user_id, name')
    .limit(5)

  if (!reviewers || reviewers.length === 0) {
    console.log('   ⚠️ 리뷰어가 없습니다')
  } else {
    // 기존 신청자 확인
    const { data: existingApps } = await supabase
      .from('applications')
      .select('id')
      .eq('campaign_id', campaign.id)

    if (!existingApps || existingApps.length === 0) {
      console.log('   테스트 신청자 생성 중...')

      for (let i = 0; i < Math.min(reviewers.length, 3); i++) {
        const reviewer = reviewers[i]
        await supabase
          .from('applications')
          .insert({
            campaign_id: campaign.id,
            reviewer_id: reviewer.user_id,
            platform: i % 2 === 0 ? 'naver' : 'coupang',
            status: i < 2 ? 'selected' : 'applied',
          })
      }
      console.log('   ✅ 테스트 신청자 3명 생성')
    } else {
      console.log('   ✅ 기존 신청자:', existingApps.length, '명')
    }
  }

  // 3. 테스트 리뷰 데이터 생성
  console.log('\n3. 테스트 리뷰 데이터 확인...')

  const { data: applications } = await supabase
    .from('applications')
    .select('id, platform, reviewer_id')
    .eq('campaign_id', campaign.id)
    .eq('status', 'selected')

  if (applications && applications.length > 0) {
    // 기존 리뷰 확인
    const { data: existingReviews } = await supabase
      .from('review_submissions')
      .select('id')
      .in('application_id', applications.map(a => a.id))

    if (!existingReviews || existingReviews.length === 0) {
      console.log('   테스트 리뷰 생성 중...')

      const reviewUrls = [
        'https://smartstore.naver.com/review/12345',
        'https://www.coupang.com/review/67890',
      ]

      const statuses = ['approved', 'pending', 'revision_requested']

      for (let i = 0; i < applications.length; i++) {
        const app = applications[i]
        await supabase
          .from('review_submissions')
          .insert({
            application_id: app.id,
            review_url: reviewUrls[i % 2],
            image_url: 'https://example.com/screenshot.jpg',
            platform: app.platform,
            status: statuses[i % 3],
          })
      }
      console.log('   ✅ 테스트 리뷰', applications.length, '건 생성')
    } else {
      console.log('   ✅ 기존 리뷰:', existingReviews.length, '건')
    }
  }

  // 4. 통계 조회
  console.log('\n4. 보고서 통계 확인...')

  const { data: apps } = await supabase
    .from('applications')
    .select('id, status')
    .eq('campaign_id', campaign.id)

  const { data: reviews } = await supabase
    .from('review_submissions')
    .select('id, status, application_id')
    .in('application_id', apps?.map(a => a.id) || [])

  const totalApps = apps?.length || 0
  const selectedApps = apps?.filter(a => a.status === 'selected').length || 0
  const totalReviews = reviews?.length || 0
  const approvedReviews = reviews?.filter(r => r.status === 'approved').length || 0

  console.log('   총 지원자:', totalApps, '명')
  console.log('   선정 인원:', selectedApps, '명')
  console.log('   제출 리뷰:', totalReviews, '건')
  console.log('   승인 리뷰:', approvedReviews, '건')

  // 5. 결과
  console.log('\n=== 테스트 완료 ===')
  console.log('\n📱 브라우저에서 결과 보고서 확인:')
  console.log('   1. http://localhost:3000/auth/login 접속')
  console.log('   2. toktak.client@gmail.com / test1234! 로그인')
  console.log(`   3. http://localhost:3000/client/campaigns/${campaign.id}/report 접속`)
  console.log('\n   또는 캠페인 상세에서 "결과 보고서" 버튼 클릭')
}

testCampaignReport().catch(console.error)
