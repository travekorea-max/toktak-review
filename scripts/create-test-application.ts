import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function createTestApplication() {
  console.log('📝 테스트 신청 생성 중...\n')

  // 리뷰어 계정 가져오기
  const { data: reviewer } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'solomon_9@naver.com')
    .single()

  if (!reviewer) {
    console.log('❌ 리뷰어 계정을 찾을 수 없습니다')
    return
  }

  console.log(`리뷰어: ${reviewer.email} (${reviewer.id})`)

  // 캠페인 가져오기
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title, platform')
    .eq('status', 'recruiting')
    .limit(3)

  if (!campaigns || campaigns.length === 0) {
    console.log('❌ 캠페인을 찾을 수 없습니다')
    return
  }

  console.log(`\n캠페인 ${campaigns.length}개 발견`)

  // 각 캠페인에 신청 생성
  for (const campaign of campaigns) {
    const platform = campaign.platform === 'both' ? 'naver' : campaign.platform

    console.log(`\n📌 ${campaign.title}`)

    const { error } = await supabase
      .from('applications')
      .insert({
        campaign_id: campaign.id,
        reviewer_id: reviewer.id,
        platform: platform,
        message: '테스트 신청입니다.',
        status: 'applied',
      })

    if (error) {
      if (error.message.includes('duplicate')) {
        console.log('   ⚠️  이미 신청됨')
      } else {
        console.log(`   ❌ 오류: ${error.message}`)
      }
    } else {
      console.log('   ✅ 신청 완료')
    }
  }

  // 결과 확인
  console.log('\n📋 전체 신청 내역:')
  const { data: apps } = await supabase
    .from('applications')
    .select('id, status, platform, campaigns(title)')
    .order('created_at', { ascending: false })

  apps?.forEach((a, i) => {
    const title = (a.campaigns as any)?.title?.substring(0, 30) || ''
    console.log(`  ${i + 1}. [${a.status}] ${a.platform} - ${title}`)
  })
}

createTestApplication().catch(console.error)
