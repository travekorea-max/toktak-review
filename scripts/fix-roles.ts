import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function fixRoles() {
  console.log('🔧 사용자 역할 수정 중...\n')

  const updates = [
    { email: 'toktak.admin@gmail.com', role: 'admin' },
    { email: 'toktak.reviewer@gmail.com', role: 'reviewer' },
    { email: 'toktak.client@gmail.com', role: 'client' },
  ]

  for (const update of updates) {
    const { error } = await supabase
      .from('users')
      .update({ role: update.role })
      .eq('email', update.email)

    if (error) {
      console.log(`❌ ${update.email}: ${error.message}`)
    } else {
      console.log(`✅ ${update.email} → ${update.role}`)
    }
  }

  // 확인
  console.log('\n📋 현재 사용자 목록:')
  const { data } = await supabase.from('users').select('email, role, status')
  console.table(data)
}

fixRoles().catch(console.error)
