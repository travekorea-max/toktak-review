import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다' },
        { status: 400 }
      )
    }

    // 6자리 랜덤 인증번호 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 만료 시간 (5분 후)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    const supabase = await createClient()

    // 기존 미인증 코드 삭제
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone', phone)
      .eq('verified', false)

    // 새 인증번호 저장
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        {
          error: '인증번호 생성에 실패했습니다',
          details: insertError.message,
          hint: insertError.hint,
        },
        { status: 500 }
      )
    }

    // TODO: 실제 SMS 발송 (네이버 클라우드, 쿨SMS 등)
    // 개발 환경에서는 콘솔에 출력
    console.log(`[SMS] ${phone}로 인증번호 ${code} 발송`)

    return NextResponse.json({
      success: true,
      message: '인증번호가 발송되었습니다',
      // 테스트를 위해 임시로 항상 코드 반환
      code,
    })
  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
