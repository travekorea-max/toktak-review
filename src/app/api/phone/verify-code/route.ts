import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: '전화번호와 인증번호를 입력해주세요' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 인증번호 조회
    const { data: verificationData, error: selectError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (selectError || !verificationData) {
      return NextResponse.json(
        { error: '인증번호가 일치하지 않거나 만료되었습니다' },
        { status: 400 }
      )
    }

    // 인증 완료 처리
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', verificationData.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: '인증 처리에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '휴대폰 인증이 완료되었습니다',
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
