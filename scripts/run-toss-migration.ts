import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMigration() {
  console.log('=== 토스페이먼츠 마이그레이션 실행 ===\n')

  // 1. campaign_payments에 토스 컬럼 추가
  console.log('1. campaign_payments 테이블에 토스 컬럼 추가...')

  // toss_payment_key 컬럼 추가
  const { error: err1 } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE campaign_payments ADD COLUMN IF NOT EXISTS toss_payment_key VARCHAR(200)`
  }).single()

  if (err1) {
    // RPC가 없으면 직접 쿼리 시도
    console.log('   RPC 사용 불가, 직접 테스트 진행...')
  }

  // 컬럼 존재 여부 확인
  const { data: columns, error: colErr } = await supabase
    .from('campaign_payments')
    .select('id')
    .limit(1)

  if (colErr) {
    console.log('   ❌ 테이블 접근 오류:', colErr.message)
    return
  }

  // 테스트: 새 컬럼으로 업데이트 시도
  const { error: testErr } = await supabase
    .from('campaign_payments')
    .update({ toss_payment_key: null })
    .eq('id', '00000000-0000-0000-0000-000000000000') // 존재하지 않는 ID

  if (testErr && testErr.message.includes('column')) {
    console.log('   ⚠️  toss_payment_key 컬럼이 없습니다.')
    console.log('   아래 SQL을 Supabase Dashboard에서 실행해주세요:\n')
    console.log('   ----------------------------------------')
    console.log(`   ALTER TABLE campaign_payments
   ADD COLUMN IF NOT EXISTS toss_payment_key VARCHAR(200),
   ADD COLUMN IF NOT EXISTS toss_secret VARCHAR(200);`)
    console.log('   ----------------------------------------\n')
  } else {
    console.log('   ✅ toss_payment_key 컬럼 존재 확인')
  }

  // 2. payment_logs 테이블 생성 확인
  console.log('\n2. payment_logs 테이블 확인...')

  const { data: logs, error: logsErr } = await supabase
    .from('payment_logs')
    .select('id')
    .limit(1)

  if (logsErr && logsErr.message.includes('does not exist')) {
    console.log('   ⚠️  payment_logs 테이블이 없습니다.')
    console.log('   아래 SQL을 Supabase Dashboard에서 실행해주세요:\n')
    console.log('   ----------------------------------------')
    console.log(`   CREATE TABLE IF NOT EXISTS payment_logs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       payment_id UUID REFERENCES campaign_payments(id) ON DELETE CASCADE,
       event_type VARCHAR(50) NOT NULL,
       event_data JSONB,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );`)
    console.log('   ----------------------------------------\n')
  } else if (logsErr) {
    console.log('   ⚠️  접근 오류:', logsErr.message)
  } else {
    console.log('   ✅ payment_logs 테이블 존재 확인')
  }

  console.log('\n=== 마이그레이션 확인 완료 ===')
  console.log('\n💡 컬럼/테이블이 없는 경우:')
  console.log('   Supabase Dashboard > SQL Editor에서')
  console.log('   supabase/toss-payments-migration.sql 파일 내용을 실행하세요.')
}

runMigration().catch(console.error)
