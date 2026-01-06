/**
 * 토스페이먼츠 결제 승인 API
 * POST /api/payments/toss/confirm
 *
 * 결제 성공 후 클라이언트에서 호출하여 결제를 최종 승인합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // DB에서 결제 정보 조회
    const { data: payment, error: fetchError } = await supabase
      .from('campaign_payments')
      .select('id, campaign_id, total_amount, payment_status')
      .eq('id', orderId)
      .single()

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 이미 처리된 결제인지 확인
    if (payment.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        message: '이미 처리된 결제입니다',
        payment,
      })
    }

    // 금액 검증
    if (payment.total_amount !== amount) {
      return NextResponse.json(
        {
          error: '결제 금액이 일치하지 않습니다',
          expected: payment.total_amount,
          received: amount,
        },
        { status: 400 }
      )
    }

    // 토스페이먼츠 결제 승인 API 호출
    const authHeader = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    const tossResult = await tossResponse.json()

    if (!tossResponse.ok) {
      console.error('Toss confirm error:', tossResult)

      // 결제 실패 처리
      await supabase
        .from('campaign_payments')
        .update({
          payment_status: 'failed',
        })
        .eq('id', orderId)

      return NextResponse.json(
        {
          error: tossResult.message || '결제 승인에 실패했습니다',
          code: tossResult.code,
        },
        { status: 400 }
      )
    }

    // 결제 성공 처리
    const { error: updateError } = await supabase
      .from('campaign_payments')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        toss_payment_key: paymentKey,
        payment_method: tossResult.method || 'toss_widget',
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Payment update error:', updateError)
      return NextResponse.json(
        { error: '결제 정보 업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    // 캠페인 상태 활성화
    await supabase
      .from('campaigns')
      .update({ status: 'recruiting' })
      .eq('id', payment.campaign_id)
      .in('status', ['pending', 'draft'])

    console.log(`[Toss Confirm] Payment confirmed: ${orderId}, Amount: ${amount}`)

    return NextResponse.json({
      success: true,
      payment: {
        id: orderId,
        amount,
        method: tossResult.method,
        approvedAt: tossResult.approvedAt,
        receipt: tossResult.receipt,
      },
    })

  } catch (error) {
    console.error('Confirm API error:', error)
    return NextResponse.json(
      { error: '결제 승인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
