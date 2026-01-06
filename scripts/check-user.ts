import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkUser() {
  const email = 'solomon_9@naver.com'

  console.log(`🔍 사용자 조회: ${email}\n`)

  // users 테이블
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  console.log('📋 users 테이블:')
  console.log(user)

  if (user) {
    // reviewer_profiles 확인
    const { data: reviewerProfile } = await supabase
      .from('reviewer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('\n📋 reviewer_profiles:')
    console.log(reviewerProfile || '없음')

    // client_profiles 확인
    const { data: clientProfile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('\n📋 client_profiles:')
    console.log(clientProfile || '없음')
  }
}

checkUser().catch(console.error)
