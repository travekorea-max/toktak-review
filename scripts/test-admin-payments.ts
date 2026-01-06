import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  console.log('=== 관리자 결제 관리 테스트 ===\n')

  // 1. 관리자 계정 확인
  const { data: admins } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'admin')

  if (!admins || admins.length === 0) {
    console.log('❌ 관리자 계정이 없습니다. 생성합니다...\n')

    // 관리자 계정 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'toktak.admin@gmail.com',
      password: 'admin1234!',
      email_confirm: true,
    })

    if (authError) {
      console.log('Auth 에러:', authError.message)
    } else if (authData.user) {
      await supabase.from('users').insert({
        id: authData.user.id,
        email: 'toktak.admin@gmail.com',
        role: 'admin',
      })
      console.log('✅ 관리자 계정 생성 완료')
      console.log('   이메일: toktak.admin@gmail.com')
      console.log('   비밀번호: admin1234!')
    }
  } else {
    console.log('👤 관리자 계정:')
    admins.forEach(a => {
      console.log(`   - ${a.email}`)
    })
  }

  // 2. 결제 데이터 확인
  const { data: payments } = await supabase
    .from('campaign_payments')
    .select(`
      id,
      payment_status,
      total_amount,
      payment_method,
      agency_fee_total,
      reward_point_total,
      created_at,
      campaigns (title)
    `)
    .order('created_at', { ascending: false })

  console.log(`\n📋 결제 데이터: ${payments?.length || 0}건`)

  if (payments && payments.length > 0) {
    const pending = payments.filter(p => p.payment_status === 'pending')
    const paid = payments.filter(p => p.payment_status === 'paid')

    console.log(`   - 입금대기: ${pending.length}건`)
    console.log(`   - 결제완료: ${paid.length}건`)

    console.log('\n최근 결제 목록:')
    payments.slice(0, 5).forEach((p, i) => {
      const status = p.payment_status === 'pending' ? '⏳대기' :
                     p.payment_status === 'paid' ? '✅완료' : '❌취소'
      const method = p.payment_method === 'bank_transfer' ? '무통장' : '카드'
      console.log(`   ${i+1}. ${status} ${p.total_amount.toLocaleString()}원 (${method})`)
      console.log(`      캠페인: ${(p.campaigns as any)?.title}`)
    })

    // 통계
    const totalRevenue = paid.reduce((sum, p) => sum + p.total_amount, 0)
    const totalAgencyFee = paid.reduce((sum, p) => sum + p.agency_fee_total, 0)
    const pendingAmount = pending.reduce((sum, p) => sum + p.total_amount, 0)

    console.log('\n💰 통계:')
    console.log(`   총 매출: ${totalRevenue.toLocaleString()}원`)
    console.log(`   플랫폼 수수료: ${totalAgencyFee.toLocaleString()}원`)
    console.log(`   입금 대기 금액: ${pendingAmount.toLocaleString()}원`)
  }

  console.log('\n=== 테스트 URL ===')
  console.log('결제 관리: http://localhost:3000/admin/payments')
  console.log('매출 리포트: http://localhost:3000/admin/payments/report')
}

test().catch(console.error)
