import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setupTestData() {
  console.log('=== 결과 보고서 테스트 데이터 설정 ===\n')

  // 1. 광고주 찾기
  const { data: client } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'toktak.client@gmail.com')
    .single()

  if (!client) {
    console.log('❌ 광고주를 찾을 수 없습니다')
    return
  }
  console.log('✅ 광고주 ID:', client.id)

  // 2. 리뷰어 찾기/생성
  let { data: reviewer } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'toktak.reviewer@gmail.com')
    .single()

  if (!reviewer) {
    // 리뷰어 계정이 없으면 생성
    console.log('리뷰어 계정 생성 중...')

    const { data: newUser } = await supabase.auth.admin.createUser({
      email: 'toktak.reviewer@gmail.com',
      password: 'test1234!',
      email_confirm: true,
    })

    if (newUser?.user) {
      await supabase.from('users').insert({
        id: newUser.user.id,
        email: 'toktak.reviewer@gmail.com',
        role: 'reviewer',
        status: 'active',
      })

      await supabase.from('reviewer_profiles').insert({
        user_id: newUser.user.id,
        name: '테스트 리뷰어',
        phone: '010-1234-5678',
        naver_id: 'test_reviewer',
        rating: 4.5,
        point_balance: 50000,
      })

      reviewer = { id: newUser.user.id }
      console.log('✅ 리뷰어 생성 완료')
    }
  } else {
    console.log('✅ 리뷰어 ID:', reviewer.id)
  }

  if (!reviewer) {
    console.log('❌ 리뷰어를 찾을 수 없습니다')
    return
  }

  // 3. 캠페인 확인
  const campaignId = 'e6b5ac29-7f9c-48dd-a13d-a6053a3261e2'

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

  // 4. 테스트 신청자 생성
  console.log('\n신청자 데이터 생성 중...')

  // 기존 데이터 삭제
  await supabase.from('applications').delete().eq('campaign_id', campaignId)

  // 여러 리뷰어 프로필 확인
  const { data: reviewerProfiles } = await supabase
    .from('reviewer_profiles')
    .select('user_id, name')

  console.log('리뷰어 프로필:', reviewerProfiles?.length || 0, '명')

  if (!reviewerProfiles || reviewerProfiles.length === 0) {
    // 테스트용 프로필 생성
    await supabase.from('reviewer_profiles').insert({
      user_id: reviewer.id,
      name: '테스트 리뷰어',
      phone: '010-1234-5678',
      naver_id: 'test_reviewer',
      rating: 4.5,
      point_balance: 50000,
    })
    reviewerProfiles?.push({ user_id: reviewer.id, name: '테스트 리뷰어' })
  }

  // 신청자 생성 (하나의 리뷰어로 여러 신청 - 실제로는 불가능하지만 테스트용)
  const applications = []
  const statuses = ['selected', 'selected', 'selected', 'applied', 'rejected']
  const platforms = ['naver', 'naver', 'naver', 'naver', 'naver']

  for (let i = 0; i < 5; i++) {
    const { data: app } = await supabase
      .from('applications')
      .insert({
        campaign_id: campaignId,
        reviewer_id: reviewerProfiles?.[0]?.user_id || reviewer.id,
        platform: platforms[i],
        status: statuses[i],
      })
      .select()
      .single()

    if (app) applications.push(app)
  }

  console.log('✅ 신청자', applications.length, '명 생성')

  // 5. 리뷰 생성
  console.log('\n리뷰 데이터 생성 중...')

  const selectedApps = applications.filter(a => a.status === 'selected')
  const reviewStatuses = ['approved', 'pending', 'revision_requested']
  const reviewUrls = [
    'https://blog.naver.com/test_reviewer/123456789',
    'https://blog.naver.com/test_reviewer/234567890',
    'https://blog.naver.com/test_reviewer/345678901',
  ]

  for (let i = 0; i < selectedApps.length; i++) {
    await supabase.from('review_submissions').insert({
      application_id: selectedApps[i].id,
      review_url: reviewUrls[i],
      image_url: 'https://example.com/screenshot.jpg',
      platform: 'naver',
      status: reviewStatuses[i],
    })
  }

  console.log('✅ 리뷰', selectedApps.length, '건 생성')

  // 6. 최종 확인
  console.log('\n=== 최종 데이터 확인 ===')

  const { data: finalApps } = await supabase
    .from('applications')
    .select('id, status')
    .eq('campaign_id', campaignId)

  const { data: finalReviews } = await supabase
    .from('review_submissions')
    .select('id, status')
    .in('application_id', finalApps?.map(a => a.id) || [])

  console.log('총 지원자:', finalApps?.length || 0, '명')
  console.log('  - 선정:', finalApps?.filter(a => a.status === 'selected').length || 0, '명')
  console.log('  - 미선정:', finalApps?.filter(a => a.status === 'rejected').length || 0, '명')
  console.log('  - 검토중:', finalApps?.filter(a => a.status === 'applied').length || 0, '명')
  console.log('제출 리뷰:', finalReviews?.length || 0, '건')
  console.log('  - 승인:', finalReviews?.filter(r => r.status === 'approved').length || 0, '건')
  console.log('  - 검토중:', finalReviews?.filter(r => r.status === 'pending').length || 0, '건')
  console.log('  - 수정요청:', finalReviews?.filter(r => r.status === 'revision_requested').length || 0, '건')

  console.log('\n=== 설정 완료 ===')
  console.log('\n📱 브라우저에서 확인:')
  console.log(`   http://localhost:3000/client/campaigns/${campaignId}/report`)
}

setupTestData().catch(console.error)
