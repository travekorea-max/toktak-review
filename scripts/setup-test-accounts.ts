import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface TestAccount {
  email: string
  password: string
  role: 'admin' | 'reviewer' | 'client'
  profile: any
}

const testAccounts: TestAccount[] = [
  {
    email: 'toktak.admin@gmail.com',
    password: 'test1234!',
    role: 'admin',
    profile: null,
  },
  {
    email: 'toktak.reviewer@gmail.com',
    password: 'test1234!',
    role: 'reviewer',
    profile: {
      name: '테스트 리뷰어',
      phone: '010-1234-5678',
      phone_verified: true,
      naver_id: 'test_naver',
      coupang_id: 'test_coupang',
      rating: 4.5,
      review_count: 10,
      point_balance: 50000,
      bank_name: '신한은행',
      bank_account: '110-123-456789',
      bank_holder: '테스트',
    },
  },
  {
    email: 'toktak.client@gmail.com',
    password: 'test1234!',
    role: 'client',
    profile: {
      company_name: '테스트 업체',
      business_number: '123-45-67890',
      representative_name: '홍길동',
      phone: '02-1234-5678',
      shop_url: 'https://smartstore.naver.com/test',
      shop_platform: 'smartstore',
      grade: 'regular',
    },
  },
]

async function testConnection() {
  console.log('🔌 Supabase 연결 테스트 중...')
  console.log(`   URL: ${supabaseUrl}`)

  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)

    if (error) {
      console.log('❌ 연결 실패:', error.message)
      return false
    }

    console.log('✅ Supabase 연결 성공!')
    return true
  } catch (err) {
    console.log('❌ 연결 오류:', err)
    return false
  }
}

async function createTestAccount(account: TestAccount) {
  console.log(`\n📝 ${account.role} 계정 생성 중: ${account.email}`)

  try {
    // 1. Auth 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`   ⚠️  이미 존재하는 계정입니다. 로그인 시도...`)

        // 기존 계정으로 로그인
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: account.email,
          password: account.password,
        })

        if (loginError) {
          console.log(`   ❌ 로그인 실패: ${loginError.message}`)
          return false
        }

        console.log(`   ✅ 기존 계정 로그인 성공`)
        return true
      }

      console.log(`   ❌ Auth 생성 실패: ${authError.message}`)
      return false
    }

    if (!authData.user) {
      console.log(`   ❌ 사용자 데이터 없음`)
      return false
    }

    const userId = authData.user.id
    console.log(`   ✅ Auth 사용자 생성됨: ${userId}`)

    // 2. users 테이블에 추가
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email: account.email,
      role: account.role,
      status: 'active',
    })

    if (userError && !userError.message.includes('duplicate')) {
      console.log(`   ❌ users 테이블 추가 실패: ${userError.message}`)
    } else {
      console.log(`   ✅ users 테이블 추가됨`)
    }

    // 3. 프로필 생성
    if (account.profile) {
      if (account.role === 'reviewer') {
        const { error: profileError } = await supabase
          .from('reviewer_profiles')
          .insert({
            user_id: userId,
            ...account.profile,
          })

        if (profileError && !profileError.message.includes('duplicate')) {
          console.log(`   ❌ 리뷰어 프로필 생성 실패: ${profileError.message}`)
        } else {
          console.log(`   ✅ 리뷰어 프로필 생성됨`)
        }
      } else if (account.role === 'client') {
        const { error: profileError } = await supabase
          .from('client_profiles')
          .insert({
            user_id: userId,
            ...account.profile,
          })

        if (profileError && !profileError.message.includes('duplicate')) {
          console.log(`   ❌ 업체 프로필 생성 실패: ${profileError.message}`)
        } else {
          console.log(`   ✅ 업체 프로필 생성됨`)
        }
      }
    }

    return true
  } catch (err) {
    console.log(`   ❌ 오류 발생: ${err}`)
    return false
  }
}

async function main() {
  console.log('========================================')
  console.log('   톡톡리뷰 테스트 계정 설정')
  console.log('========================================\n')

  // 연결 테스트
  const connected = await testConnection()
  if (!connected) {
    console.log('\n❌ Supabase 연결에 실패했습니다. 환경변수를 확인하세요.')
    process.exit(1)
  }

  // 테스트 계정 생성
  console.log('\n📦 테스트 계정 생성 시작...')

  for (const account of testAccounts) {
    await createTestAccount(account)
  }

  console.log('\n========================================')
  console.log('   테스트 계정 정보')
  console.log('========================================')
  console.log('\n🔑 로그인 정보:')
  console.log('   관리자: toktak.admin@gmail.com / test1234!')
  console.log('   리뷰어: toktak.reviewer@gmail.com / test1234!')
  console.log('   업체:   toktak.client@gmail.com / test1234!')
  console.log('\n✨ 설정 완료!')
}

main().catch(console.error)
