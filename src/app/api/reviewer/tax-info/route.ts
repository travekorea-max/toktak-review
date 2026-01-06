/**
 * 리뷰어 세무정보 관리 API
 * GET  /api/reviewer/tax-info - 등록 여부 확인
 * POST /api/reviewer/tax-info - 세무정보 등록
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processTaxInfo, maskRRN, decrypt, validateRRNFormat } from '@/lib/billing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 세무정보 등록 여부 확인
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 세무정보 조회
    const { data: taxInfo, error } = await supabase
      .from('reviewer_tax_info')
      .select('id, legal_name, verified_at, created_at, encrypted_rrn')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!taxInfo) {
      return NextResponse.json({
        registered: false,
        message: '세무정보가 등록되지 않았습니다. 출금 신청 시 등록이 필요합니다.',
      })
    }

    // 마스킹된 주민번호
    let maskedRrn = '******-*******'
    try {
      const decrypted = decrypt(taxInfo.encrypted_rrn)
      maskedRrn = maskRRN(decrypted)
    } catch {
      // 복호화 실패 시 기본 마스킹
    }

    return NextResponse.json({
      registered: true,
      legalName: taxInfo.legal_name,
      maskedRrn,
      verifiedAt: taxInfo.verified_at,
      registeredAt: taxInfo.created_at,
    })
  } catch (error) {
    console.error('Tax info check error:', error)
    return NextResponse.json(
      { error: '세무정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 세무정보 등록
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rrn, legalName, verificationMethod = 'manual' } = await request.json()

    // 입력값 검증
    if (!rrn || !legalName) {
      return NextResponse.json(
        { error: '주민등록번호와 실명을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!validateRRNFormat(rrn)) {
      return NextResponse.json(
        { error: '유효하지 않은 주민등록번호입니다.' },
        { status: 400 }
      )
    }

    // 암호화 처리
    const processed = processTaxInfo({ rrn, legalName })

    // 중복 체크 (해시 기반)
    const { data: existing } = await supabase
      .from('reviewer_tax_info')
      .select('id, user_id')
      .eq('rrn_hash', processed.rrnHash)
      .single()

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json(
        { error: '이미 등록된 주민등록번호입니다.' },
        { status: 409 }
      )
    }

    // 기존 정보가 있으면 업데이트, 없으면 생성
    const { data: userTaxInfo } = await supabase
      .from('reviewer_tax_info')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (userTaxInfo) {
      // 업데이트
      const { error: updateError } = await supabase
        .from('reviewer_tax_info')
        .update({
          encrypted_rrn: processed.encryptedRrn,
          rrn_hash: processed.rrnHash,
          legal_name: processed.legalName,
          verification_method: verificationMethod,
          verified_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // 생성
      const { error: insertError } = await supabase
        .from('reviewer_tax_info')
        .insert({
          user_id: user.id,
          encrypted_rrn: processed.encryptedRrn,
          rrn_hash: processed.rrnHash,
          legal_name: processed.legalName,
          verification_method: verificationMethod,
          verified_at: new Date().toISOString(),
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: '세무정보가 등록되었습니다.',
      maskedRrn: processed.maskedRrn,
      legalName: processed.legalName,
    })
  } catch (error) {
    console.error('Tax info registration error:', error)
    return NextResponse.json(
      { error: '세무정보 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
