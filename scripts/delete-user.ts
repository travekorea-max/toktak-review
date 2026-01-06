import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function deleteUser() {
  const email = 'solomon_9@naver.com'

  console.log(`🗑️  사용자 삭제: ${email}\n`)

  // users 테이블에서 user_id 가져오기
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) {
    console.log('❌ 사용자를 찾을 수 없습니다.')
    return
  }

  const userId = user.id
  console.log(`User ID: ${userId}\n`)

  // 1. reviewer_profiles 삭제
  const { error: reviewerError } = await supabase
    .from('reviewer_profiles')
    .delete()
    .eq('user_id', userId)

  if (reviewerError) {
    console.log(`❌ reviewer_profiles 삭제 실패: ${reviewerError.message}`)
  } else {
    console.log('✅ reviewer_profiles 삭제 완료')
  }

  // 2. client_profiles 삭제
  const { error: clientError } = await supabase
    .from('client_profiles')
    .delete()
    .eq('user_id', userId)

  if (clientError) {
    console.log(`❌ client_profiles 삭제 실패: ${clientError.message}`)
  } else {
    console.log('✅ client_profiles 삭제 완료')
  }

  // 3. users 테이블 삭제
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (userError) {
    console.log(`❌ users 삭제 실패: ${userError.message}`)
  } else {
    console.log('✅ users 테이블 삭제 완료')
  }

  console.log('\n⚠️  Supabase Auth에서도 사용자를 삭제해야 합니다.')
  console.log('   Dashboard → Authentication → Users → solomon_9@naver.com 삭제')
}

deleteUser().catch(console.error)
