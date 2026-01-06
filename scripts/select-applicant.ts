import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function selectApplicant() {
  console.log('📋 신청 내역 조회 중...\n')

  // 신청 내역 확인
  const { data: apps, error: fetchError } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.log('조회 오류:', fetchError.message)
    return
  }

  if (!apps || apps.length === 0) {
    console.log('❌ 신청 내역이 없습니다')
    return
  }

  console.log('현재 신청 내역:')
  apps.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.status}] ${a.platform} - campaign: ${a.campaign_id.substring(0, 8)}...`)
  })

  // applied 상태인 신청 선정
  const pendingApps = apps.filter(a => a.status === 'applied')

  if (pendingApps.length === 0) {
    console.log('\n⚠️  선정 대기중인 신청이 없습니다')
    return
  }

  console.log(`\n🎯 ${pendingApps.length}건 선정 처리 중...`)

  const { error } = await supabase
    .from('applications')
    .update({
      status: 'selected',
      selected_at: new Date().toISOString(),
    })
    .eq('status', 'applied')

  if (error) {
    console.log('❌ 오류:', error.message)
    return
  }

  console.log('✅ 선정 완료!')

  // 결과 확인
  const { data: updated } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('\n📋 업데이트된 신청 내역:')
  updated?.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.status}] ${a.platform}`)
  })
}

selectApplicant().catch(console.error)
