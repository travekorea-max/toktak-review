import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testLogin(email: string, password: string) {
  console.log(`\n🔐 로그인 테스트: ${email}`)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log(`   ❌ 로그인 실패: ${error.message}`)
    return
  }

  console.log(`   ✅ 로그인 성공!`)
  console.log(`   - User ID: ${data.user?.id}`)

  // 사용자 정보 확인
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user!.id)
    .single()

  if (userData) {
    console.log(`   - Role: ${userData.role}`)
    console.log(`   - Status: ${userData.status}`)
  }

  await supabase.auth.signOut()
}

async function main() {
  console.log('========================================')
  console.log('   로그인 테스트')
  console.log('========================================')

  await testLogin('toktak.admin@gmail.com', 'test1234!')
  await testLogin('toktak.reviewer@gmail.com', 'test1234!')
  await testLogin('toktak.client@gmail.com', 'test1234!')

  console.log('\n✨ 테스트 완료!')
}

main().catch(console.error)
