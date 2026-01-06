/**
 * 입금 시뮬레이션 API (개발/테스트용)
 * POST /api/payments/simulate-deposit
 *
 * 실제 PG 연동 전 테스트용으로 사용
 * 프로덕션에서는 비활성화 권장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // 프로덕션에서는 비활성화
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEPOSIT_SIMULATION) {
    return NextResponse.json(
      { error: 'Simulation not allowed in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { paymentId, depositorName = '테스트입금자' } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      )
    }

    // 결제 정보 조회
    const { data: payment, error: fetchError } = await supabase
      .from('campaign_payments')
      .select(`
        id,
        campaign_id,
        total_amount,
        payment_status,
        virtual_account_number,
        campaigns (title)
      `)
      .eq('id', paymentId)
      .single()

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Payment already confirmed', payment },
        { status: 400 }
      )
    }

    if (payment.payment_status === 'cancelled') {
      return NextResponse.json(
        { error: 'Payment was cancelled' },
        { status: 400 }
      )
    }

    // 내부 웹훅 호출 시뮬레이션
    const webhookPayload = {
      paymentId: payment.id,
      accountNumber: payment.virtual_account_number,
      amount: payment.total_amount,
      depositorName,
      depositedAt: new Date().toISOString(),
    }

    // 웹훅 엔드포인트 호출
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const webhookResponse = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pg-provider': 'test',
      },
      body: JSON.stringify(webhookPayload),
    })

    const webhookResult = await webhookResponse.json()

    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: 'Webhook processing failed', details: webhookResult },
        { status: webhookResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: '입금 시뮬레이션 완료',
      payment: {
        id: payment.id,
        amount: payment.total_amount,
        campaign: (payment.campaigns as any)?.title,
      },
      webhookResult,
    })

  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { error: 'Simulation failed' },
      { status: 500 }
    )
  }
}

// 시뮬레이션 가능한 결제 목록 조회
export async function GET() {
  try {
    const { data: payments, error } = await supabase
      .from('campaign_payments')
      .select(`
        id,
        total_amount,
        payment_status,
        payment_method,
        virtual_account_number,
        created_at,
        campaigns (title)
      `)
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      message: '입금 대기중인 결제 목록',
      count: payments?.length || 0,
      payments: payments?.map(p => ({
        id: p.id,
        amount: p.total_amount,
        method: p.payment_method,
        accountNumber: p.virtual_account_number,
        campaign: (p.campaigns as any)?.title,
        createdAt: p.created_at,
      })),
      simulateUrl: 'POST /api/payments/simulate-deposit',
      exampleBody: payments?.[0] ? {
        paymentId: payments[0].id,
        depositorName: '홍길동',
      } : null,
    })

  } catch (error) {
    console.error('Error fetching pending payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
