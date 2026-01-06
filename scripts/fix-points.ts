import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function fixPoints() {
  console.log('🔧 포인트 수정 시작...\n')

  // 이훈구 프로필 가져오기
  const { data: hungu } = await supabase
    .from('reviewer_profiles')
    .select('user_id, name, point_balance')
    .eq('name', '이훈구')
    .single()

  if (!hungu) {
    console.log('❌ 이훈구 프로필을 찾을 수 없습니다')
    return
  }

  console.log(`👤 ${hungu.name} (현재 포인트: ${hungu.point_balance}P)\n`)

  // 이훈구의 승인된 리뷰 찾기
  const { data: apps } = await supabase
    .from('applications')
    .select('id, platform, campaigns(review_fee_naver, review_fee_coupang)')
    .eq('reviewer_id', hungu.user_id)

  let totalPoints = 0
  let currentBalance = hungu.point_balance

  for (const app of apps || []) {
    // 이 신청에 승인된 리뷰가 있는지 확인
    const { data: review } = await supabase
      .from('review_submissions')
      .select('id, status')
      .eq('application_id', app.id)
      .eq('status', 'approved')
      .single()

    if (!review) continue

    // 이미 포인트가 지급되었는지 확인
    const { data: existingTx } = await supabase
      .from('point_transactions')
      .select('id')
      .eq('reviewer_id', hungu.user_id)
      .like('description', `%${app.id.substring(0, 8)}%`)
      .single()

    if (existingTx) {
      console.log(`⚠️  이미 포인트 지급됨: ${app.id.substring(0, 8)}...`)
      continue
    }

    const campaign = app.campaigns as any
    const pointAmount = app.platform === 'naver'
      ? campaign.review_fee_naver
      : campaign.review_fee_coupang

    // 포인트 트랜잭션 생성
    const newBalance = currentBalance + pointAmount
    const { error: txError } = await supabase
      .from('point_transactions')
      .insert({
        reviewer_id: hungu.user_id,
        type: 'earn',
        amount: pointAmount,
        balance_after: newBalance,
        reference_type: 'review',
        reference_id: review.id,
        description: `리뷰 승인 포인트 (${app.platform})`,
      })

    if (txError) {
      console.log(`❌ 트랜잭션 생성 오류: ${txError.message}`)
      continue
    }

    currentBalance = newBalance
    totalPoints += pointAmount
    console.log(`✅ 포인트 지급: ${pointAmount.toLocaleString()}P (${app.platform})`)
  }

  if (totalPoints > 0) {
    // 포인트 잔액 업데이트
    const newBalance = hungu.point_balance + totalPoints
    const { error: updateError } = await supabase
      .from('reviewer_profiles')
      .update({ point_balance: newBalance })
      .eq('user_id', hungu.user_id)

    if (updateError) {
      console.log(`❌ 잔액 업데이트 오류: ${updateError.message}`)
    } else {
      console.log(`\n💰 총 ${totalPoints.toLocaleString()}P 지급 완료`)
      console.log(`📊 새 잔액: ${newBalance.toLocaleString()}P`)
    }
  } else {
    console.log('\n⚠️  추가 지급할 포인트가 없습니다')
  }

  // 최종 확인
  console.log('\n📋 최종 포인트 현황:')
  const { data: profiles } = await supabase
    .from('reviewer_profiles')
    .select('name, point_balance')

  profiles?.forEach(p => {
    console.log(`  - ${p.name}: ${p.point_balance?.toLocaleString() || 0}P`)
  })
}

fixPoints().catch(console.error)
