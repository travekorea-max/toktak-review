import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function approveCampaigns() {
  console.log('🔧 캠페인 승인 처리 중...\n')

  // recruiting 상태인 캠페인들을 approved로 변경
  const { error, count } = await supabase
    .from('campaigns')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString()
    })
    .eq('status', 'recruiting')

  if (error) {
    console.log('❌ 오류:', error.message)
  } else {
    console.log(`✅ 캠페인 승인 완료`)
  }

  // 결과 확인
  const { data } = await supabase
    .from('campaigns')
    .select('title, platform, status')
    .order('created_at', { ascending: false })

  console.log('\n📋 캠페인 상태:')
  console.table(data)
}

approveCampaigns().catch(console.error)
