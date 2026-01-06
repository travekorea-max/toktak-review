import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function adminApproveReviews() {
  console.log('🔍 관리자 리뷰 검수 테스트\n')

  // 대기중인 리뷰 조회
  const { data: pendingReviews } = await supabase
    .from('review_submissions')
    .select('id, platform, status, application_id')
    .eq('status', 'pending')

  if (!pendingReviews || pendingReviews.length === 0) {
    console.log('❌ 검수 대기중인 리뷰가 없습니다')
    return
  }

  console.log(`📋 검수 대기 리뷰: ${pendingReviews.length}건\n`)

  // 리뷰 승인 처리
  for (const review of pendingReviews) {
    console.log(`📌 리뷰 ID: ${review.id.substring(0, 8)}... (${review.platform})`)

    const { error } = await supabase
      .from('review_submissions')
      .update({
        status: 'approved',
        checked_at: new Date().toISOString(),
      })
      .eq('id', review.id)

    if (error) {
      console.log(`   ❌ 승인 실패: ${error.message}`)
      continue
    }

    console.log('   ✅ 리뷰 승인 완료')

    // 포인트 지급 처리 (application에서 캠페인 정보 조회)
    const { data: app } = await supabase
      .from('applications')
      .select('reviewer_id, platform, campaigns(review_fee_naver, review_fee_coupang)')
      .eq('id', review.application_id)
      .single()

    if (app) {
      const campaign = app.campaigns as any
      const pointAmount = app.platform === 'naver'
        ? campaign.review_fee_naver
        : campaign.review_fee_coupang

      // 리뷰어 포인트 잔액 조회
      const { data: profile } = await supabase
        .from('reviewer_profiles')
        .select('point_balance')
        .eq('user_id', app.reviewer_id)
        .single()

      if (profile) {
        const newBalance = profile.point_balance + pointAmount

        // 포인트 트랜잭션 기록
        const { error: pointError } = await supabase
          .from('point_transactions')
          .insert({
            reviewer_id: app.reviewer_id,
            type: 'earn',
            amount: pointAmount,
            balance_after: newBalance,
            reference_type: 'review',
            reference_id: review.id,
            description: `리뷰 승인 포인트 (${review.platform})`,
          })

        if (!pointError) {
          console.log(`   💰 포인트 지급: ${pointAmount.toLocaleString()}P`)

          // 리뷰어 포인트 잔액 업데이트
          await supabase
            .from('reviewer_profiles')
            .update({ point_balance: newBalance })
            .eq('user_id', app.reviewer_id)
        } else {
          console.log(`   ❌ 포인트 지급 실패: ${pointError.message}`)
        }
      }
    }
  }

  // 최종 현황
  console.log('\n📋 리뷰 승인 결과:')
  const { data: reviews } = await supabase
    .from('review_submissions')
    .select('platform, status')
    .order('created_at', { ascending: false })

  reviews?.forEach((r, i) => {
    const icon = r.status === 'approved' ? '✅' : '⏳'
    console.log(`  ${i + 1}. ${icon} [${r.status}] ${r.platform}`)
  })

  // 포인트 현황
  console.log('\n💰 리뷰어 포인트 현황:')
  const { data: profiles } = await supabase
    .from('reviewer_profiles')
    .select('name, point_balance')

  profiles?.forEach(p => {
    console.log(`  - ${p.name}: ${p.point_balance.toLocaleString()}P`)
  })

  console.log('\n✨ 관리자 리뷰 검수 완료!')
}

adminApproveReviews().catch(console.error)
