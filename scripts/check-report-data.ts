import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkData() {
  const campaignId = 'e6b5ac29-7f9c-48dd-a13d-a6053a3261e2'

  console.log('=== 결과 보고서 데이터 확인 ===\n')

  // 캠페인 정보
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('title, status, platform, recruit_count_naver, recruit_count_coupang')
    .eq('id', campaignId)
    .single()

  console.log('📋 캠페인:', campaign?.title)
  console.log('   상태:', campaign?.status)
  console.log('   플랫폼:', campaign?.platform)
  console.log('   목표 인원: 네이버', campaign?.recruit_count_naver, '명, 쿠팡', campaign?.recruit_count_coupang, '명')

  // 신청자
  const { data: apps } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      platform,
      reviewer_profiles:reviewer_id (name)
    `)
    .eq('campaign_id', campaignId)

  console.log('\n👥 신청자:', apps?.length || 0, '명')
  apps?.forEach(a => {
    const name = (a.reviewer_profiles as any)?.name || '알 수 없음'
    console.log(`   - ${name}: ${a.status} (${a.platform})`)
  })

  // 리뷰
  if (apps && apps.length > 0) {
    const { data: reviews } = await supabase
      .from('review_submissions')
      .select('id, status, review_url, platform')
      .in('application_id', apps.map(a => a.id))

    console.log('\n📝 리뷰:', reviews?.length || 0, '건')
    reviews?.forEach(r => {
      console.log(`   - ${r.status}: ${r.review_url?.substring(0, 50)}...`)
    })

    // 통계 요약
    const selected = apps.filter(a => a.status === 'selected').length
    const approved = reviews?.filter(r => r.status === 'approved').length || 0
    const pending = reviews?.filter(r => ['pending', 'ai_passed', 'needs_review'].includes(r.status)).length || 0

    console.log('\n📊 통계 요약:')
    console.log(`   지원자: ${apps.length}명 / 선정: ${selected}명`)
    console.log(`   리뷰 제출: ${reviews?.length || 0}건 / 승인: ${approved}건 / 검토중: ${pending}건`)
    console.log(`   리뷰 제출률: ${selected > 0 ? Math.round((reviews?.length || 0) / selected * 100) : 0}%`)
    console.log(`   리뷰 승인률: ${(reviews?.length || 0) > 0 ? Math.round(approved / (reviews?.length || 1) * 100) : 0}%`)
  }

  console.log('\n=== 확인 완료 ===')
}

checkData().catch(console.error)
