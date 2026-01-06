import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
  console.log('=== 포인트 현황 확인 ===\n')

  // 포인트 트랜잭션 확인
  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('reviewer_id, type, amount, description, created_at')
    .order('created_at', { ascending: false })

  console.log('📋 포인트 트랜잭션:')
  if (transactions && transactions.length > 0) {
    transactions.forEach((t, i) => {
      console.log(`  ${i+1}. ${t.type} ${t.amount}P - ${t.description}`)
    })
  } else {
    console.log('  없음')
  }

  // 리뷰어 프로필 확인
  console.log('\n📋 리뷰어 프로필:')
  const { data: profiles } = await supabase
    .from('reviewer_profiles')
    .select('user_id, name, point_balance')

  profiles?.forEach(p => {
    console.log(`  - ${p.name}: ${p.point_balance?.toLocaleString() || 0}P`)
  })

  // 이훈구의 리뷰 확인
  console.log('\n📋 이훈구 관련 데이터:')
  const { data: hungu } = await supabase
    .from('reviewer_profiles')
    .select('user_id, name, point_balance')
    .eq('name', '이훈구')
    .single()

  if (hungu) {
    console.log(`  user_id: ${hungu.user_id}`)
    console.log(`  현재 포인트: ${hungu.point_balance}P`)

    // 이훈구의 신청 확인
    const { data: apps } = await supabase
      .from('applications')
      .select('id, platform, status, campaigns(review_fee_naver, review_fee_coupang)')
      .eq('reviewer_id', hungu.user_id)

    console.log(`\n  신청 내역: ${apps?.length || 0}건`)
    apps?.forEach((a, i) => {
      const campaign = a.campaigns as any
      const fee = a.platform === 'naver' ? campaign?.review_fee_naver : campaign?.review_fee_coupang
      console.log(`    ${i+1}. ${a.platform} [${a.status}] - 리뷰비: ${fee?.toLocaleString() || 0}P`)
    })

    // 이훈구의 승인된 리뷰 확인
    const { data: reviews } = await supabase
      .from('review_submissions')
      .select('id, platform, status, application_id')
      .eq('status', 'approved')

    console.log(`\n  승인된 리뷰:`)
    for (const r of reviews || []) {
      const { data: app } = await supabase
        .from('applications')
        .select('reviewer_id')
        .eq('id', r.application_id)
        .single()

      if (app?.reviewer_id === hungu.user_id) {
        console.log(`    - ${r.platform} (app: ${r.application_id.substring(0,8)}...)`)
      }
    }

    // 이훈구의 포인트 트랜잭션
    const { data: hunguTx } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('reviewer_id', hungu.user_id)

    console.log(`\n  포인트 트랜잭션: ${hunguTx?.length || 0}건`)
    hunguTx?.forEach((t, i) => {
      console.log(`    ${i+1}. ${t.type} ${t.amount}P - ${t.description}`)
    })
  }
}

check().catch(console.error)
