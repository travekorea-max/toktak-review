/**
 * 결제/정산 시스템 마이그레이션 실행 스크립트
 *
 * Supabase Dashboard의 SQL Editor에서 직접 실행하거나,
 * Service Role Key가 있으면 이 스크립트로 실행 가능합니다.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 결제/정산 시스템 마이그레이션 시작...\n')

  // 개별 마이그레이션 쿼리 실행
  const migrations = [
    {
      name: 'Enum 타입 생성 (payment_status)',
      sql: `DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
    },
    {
      name: 'Enum 타입 생성 (payment_method)',
      sql: `DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'virtual_account'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
    },
    {
      name: '플랫폼 설정값 추가',
      sql: `
        INSERT INTO settings (key, value, updated_at) VALUES
          ('agency_fee_per_person', '3000', NOW()),
          ('withholding_tax_rate', '0.033', NOW()),
          ('min_withdrawal_amount', '10000', NOW()),
          ('withdrawal_fee', '0', NOW())
        ON CONFLICT (key) DO NOTHING;
      `
    },
    {
      name: 'campaigns 테이블 컬럼 추가',
      sql: `
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS agency_fee_per_person INTEGER DEFAULT 3000;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS supply_price INTEGER DEFAULT 0;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS vat_amount INTEGER DEFAULT 0;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_billing_amount INTEGER DEFAULT 0;
      `
    },
    {
      name: 'campaign_payments 테이블 생성',
      sql: `
        CREATE TABLE IF NOT EXISTS campaign_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
          client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recruit_count INTEGER NOT NULL,
          reward_point_total INTEGER NOT NULL,
          agency_fee_total INTEGER NOT NULL,
          supply_price INTEGER NOT NULL,
          vat_amount INTEGER NOT NULL,
          total_amount INTEGER NOT NULL,
          payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
          payment_status payment_status NOT NULL DEFAULT 'pending',
          tax_invoice_number VARCHAR(50),
          tax_invoice_issued_at TIMESTAMPTZ,
          tax_invoice_email VARCHAR(255),
          pg_provider VARCHAR(50),
          pg_transaction_id VARCHAR(100),
          pg_approved_at TIMESTAMPTZ,
          virtual_bank_name VARCHAR(50),
          virtual_account_number VARCHAR(50),
          virtual_account_holder VARCHAR(50),
          virtual_account_due_date TIMESTAMPTZ,
          paid_at TIMESTAMPTZ,
          cancelled_at TIMESTAMPTZ,
          refunded_at TIMESTAMPTZ,
          refund_amount INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'campaign_payments 인덱스 생성',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_campaign_payments_campaign ON campaign_payments(campaign_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_payments_client ON campaign_payments(client_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_payments_status ON campaign_payments(payment_status);
        CREATE INDEX IF NOT EXISTS idx_campaign_payments_created ON campaign_payments(created_at);
      `
    },
    {
      name: 'reviewer_tax_info 테이블 생성',
      sql: `
        CREATE TABLE IF NOT EXISTS reviewer_tax_info (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          encrypted_rrn TEXT NOT NULL,
          rrn_hash VARCHAR(64) NOT NULL,
          legal_name VARCHAR(50) NOT NULL,
          verified_at TIMESTAMPTZ,
          verification_method VARCHAR(20),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'reviewer_tax_info 인덱스 생성',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_reviewer_tax_info_user ON reviewer_tax_info(user_id);
        CREATE INDEX IF NOT EXISTS idx_reviewer_tax_info_hash ON reviewer_tax_info(rrn_hash);
      `
    },
    {
      name: 'withdrawal_requests 컬럼 추가',
      sql: `
        ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS gross_amount INTEGER;
        ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS withholding_tax INTEGER;
        ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS actual_payout INTEGER;
        ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS tax_reported BOOLEAN DEFAULT FALSE;
        ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS tax_reported_at TIMESTAMPTZ;
        ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS tax_report_period VARCHAR(10);
      `
    },
    {
      name: 'withdrawal_requests 기존 데이터 마이그레이션',
      sql: `
        UPDATE withdrawal_requests
        SET gross_amount = amount,
            withholding_tax = fee,
            actual_payout = net_amount
        WHERE gross_amount IS NULL;
      `
    },
  ]

  let successCount = 0
  let failCount = 0

  for (const migration of migrations) {
    try {
      console.log(`📌 ${migration.name}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: migration.sql })

      if (error) {
        // RPC가 없으면 직접 실행 시도 (제한적)
        throw error
      }

      console.log(`   ✅ 성공`)
      successCount++
    } catch (error: any) {
      console.log(`   ⚠️  스킵 또는 실패: ${error.message || '권한 필요'}`)
      failCount++
    }
  }

  console.log(`\n📊 결과: ${successCount}개 성공, ${failCount}개 실패/스킵`)

  if (failCount > 0) {
    console.log('\n⚠️  일부 마이그레이션이 실패했습니다.')
    console.log('   Supabase Dashboard > SQL Editor에서 직접 실행해주세요.')
    console.log('   파일: supabase/billing-payout-system.sql')
  }
}

// 테이블 존재 여부 확인
async function checkTables() {
  console.log('\n📋 테이블 상태 확인...\n')

  const tables = [
    'campaign_payments',
    'reviewer_tax_info',
  ]

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1)

    if (error && error.code === '42P01') {
      console.log(`   ❌ ${table}: 존재하지 않음`)
    } else if (error) {
      console.log(`   ⚠️  ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: 존재함`)
    }
  }

  // settings 확인
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['agency_fee_per_person', 'withholding_tax_rate'])

  console.log('\n📋 설정값 확인:')
  settings?.forEach(s => {
    console.log(`   - ${s.key}: ${s.value}`)
  })
}

async function main() {
  await runMigration()
  await checkTables()

  console.log('\n✨ 마이그레이션 스크립트 완료')
  console.log('\n💡 전체 SQL 파일은 Supabase Dashboard에서 실행하세요:')
  console.log('   1. https://supabase.com/dashboard 접속')
  console.log('   2. 프로젝트 선택 > SQL Editor')
  console.log('   3. supabase/billing-payout-system.sql 내용 붙여넣기')
  console.log('   4. Run 클릭')
}

main().catch(console.error)
