import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // verification_codes 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.verification_codes (
        id BIGSERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    const createIndexSQL1 = `
      CREATE INDEX IF NOT EXISTS idx_verification_codes_phone
      ON public.verification_codes(phone);
    `

    const createIndexSQL2 = `
      CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at
      ON public.verification_codes(expires_at);
    `

    const enableRLSSQL = `
      ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
    `

    const createPolicy1SQL = `
      DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.verification_codes;
      CREATE POLICY "Anyone can insert verification codes" ON public.verification_codes
        FOR INSERT WITH CHECK (true);
    `

    const createPolicy2SQL = `
      DROP POLICY IF EXISTS "Anyone can read their verification codes" ON public.verification_codes;
      CREATE POLICY "Anyone can read their verification codes" ON public.verification_codes
        FOR SELECT USING (true);
    `

    const createPolicy3SQL = `
      DROP POLICY IF EXISTS "Anyone can update their verification codes" ON public.verification_codes;
      CREATE POLICY "Anyone can update their verification codes" ON public.verification_codes
        FOR UPDATE USING (true);
    `

    // 각 SQL 실행
    const results = []

    // 테이블 생성
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    if (tableError) {
      results.push({ step: 'create_table', error: tableError.message })
    } else {
      results.push({ step: 'create_table', success: true })
    }

    // 인덱스 생성
    const { error: index1Error } = await supabase.rpc('exec_sql', { sql: createIndexSQL1 })
    if (index1Error) {
      results.push({ step: 'create_index_phone', error: index1Error.message })
    } else {
      results.push({ step: 'create_index_phone', success: true })
    }

    const { error: index2Error } = await supabase.rpc('exec_sql', { sql: createIndexSQL2 })
    if (index2Error) {
      results.push({ step: 'create_index_expires', error: index2Error.message })
    } else {
      results.push({ step: 'create_index_expires', success: true })
    }

    // RLS 활성화
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL })
    if (rlsError) {
      results.push({ step: 'enable_rls', error: rlsError.message })
    } else {
      results.push({ step: 'enable_rls', success: true })
    }

    // 정책 생성
    const { error: policy1Error } = await supabase.rpc('exec_sql', { sql: createPolicy1SQL })
    if (policy1Error) {
      results.push({ step: 'create_policy_insert', error: policy1Error.message })
    } else {
      results.push({ step: 'create_policy_insert', success: true })
    }

    const { error: policy2Error } = await supabase.rpc('exec_sql', { sql: createPolicy2SQL })
    if (policy2Error) {
      results.push({ step: 'create_policy_select', error: policy2Error.message })
    } else {
      results.push({ step: 'create_policy_select', success: true })
    }

    const { error: policy3Error } = await supabase.rpc('exec_sql', { sql: createPolicy3SQL })
    if (policy3Error) {
      results.push({ step: 'create_policy_update', error: policy3Error.message })
    } else {
      results.push({ step: 'create_policy_update', success: true })
    }

    return NextResponse.json({
      message: 'Setup completed',
      results,
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
