/**
 * 토스페이먼츠 웹훅 API
 * POST /api/payments/toss/webhook - 입금 알림 수신
 *
 * 토스페이먼츠에서 가상계좌 입금 시 호출됩니다.
 *
 * @see https://docs.tosspayments.com/guides/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature, getPayment } from '@/lib/payments/toss'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 웹훅 이벤트 타입
interface TossWebhookEvent {
  eventType: 'PAYMENT_STATUS_CHANGED' | 'DEPOSIT_CALLBACK'
  createdAt: string
  data: {
    paymentKey?: string
    orderId: string
    status: string
    transactionKey?: string
    secret?: string
  }
}

// 가상계좌 입금 콜백 (Deposit Callback)
interface TossDepositCallback {
  createdAt: string
  secret: string
  status: 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED'
  transactionKey: string
  orderId: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-tosspayments-signature') || ''

    // 프로덕션에서는 서명 검증
    if (process.env.NODE_ENV === 'production' && process.env.TOSS_SECRET_KEY) {
      if (!verifyWebhookSignature(body, signature)) {
        console.error('[Toss Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(body) as TossWebhookEvent | TossDepositCallback

    console.log('[Toss Webhook] Received:', JSON.stringify(data, null, 2))

    // 이벤트 타입에 따른 처리
    if ('eventType' in data) {
      // 일반 웹훅 이벤트
      return handleWebhookEvent(data)
    } else if ('secret' in data) {
      // 가상계좌 입금 콜백
      return handleDepositCallback(data)
    }

    return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })

  } catch (error) {
    console.error('[Toss Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 일반 웹훅 이벤트 처리
 */
async function handleWebhookEvent(event: TossWebhookEvent) {
  const { eventType, data } = event

  console.log(`[Toss Webhook] Event: ${eventType}, OrderId: ${data.orderId}, Status: ${data.status}`)

  if (eventType === 'PAYMENT_STATUS_CHANGED') {
    // 결제 상태 변경
    if (data.status === 'DONE') {
      return confirmPayment(data.orderId, data.paymentKey)
    } else if (data.status === 'CANCELED') {
      return cancelPayment(data.orderId)
    }
  }

  return NextResponse.json({ success: true, message: 'Event received' })
}

/**
 * 가상계좌 입금 콜백 처리
 */
async function handleDepositCallback(callback: TossDepositCallback) {
  const { orderId, status, secret } = callback

  console.log(`[Toss Webhook] Deposit Callback: OrderId: ${orderId}, Status: ${status}`)

  // 결제 정보 조회 (secret 검증)
  const { data: payment, error: fetchError } = await supabase
    .from('campaign_payments')
    .select('id, toss_secret, payment_status, total_amount, campaign_id')
    .eq('id', orderId)
    .single()

  if (fetchError || !payment) {
    console.error('[Toss Webhook] Payment not found:', orderId)
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  // Secret 검증 (프로덕션에서)
  if (process.env.NODE_ENV === 'production' && payment.toss_secret) {
    if (payment.toss_secret !== secret) {
      console.error('[Toss Webhook] Secret mismatch')
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }
  }

  if (status === 'DONE') {
    return confirmPayment(orderId)
  } else if (status === 'CANCELED' || status === 'PARTIAL_CANCELED') {
    return cancelPayment(orderId)
  }

  return NextResponse.json({ success: true })
}

/**
 * 결제 확인 처리
 */
async function confirmPayment(orderId: string, paymentKey?: string) {
  // 결제 정보 조회
  const { data: payment, error: fetchError } = await supabase
    .from('campaign_payments')
    .select('id, campaign_id, payment_status, total_amount')
    .eq('id', orderId)
    .single()

  if (fetchError || !payment) {
    console.error('[Toss Webhook] Payment not found:', orderId)
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  // 이미 처리된 결제인지 확인
  if (payment.payment_status === 'paid') {
    console.log('[Toss Webhook] Already confirmed:', orderId)
    return NextResponse.json({ success: true, message: 'Already processed' })
  }

  // paymentKey가 있으면 토스에서 실제 결제 정보 조회하여 금액 검증
  if (paymentKey) {
    const tossPayment = await getPayment(paymentKey)
    if (tossPayment && tossPayment.totalAmount !== payment.total_amount) {
      console.error('[Toss Webhook] Amount mismatch:', {
        expected: payment.total_amount,
        received: tossPayment.totalAmount,
      })
      return NextResponse.json({
        error: 'Amount mismatch',
        expected: payment.total_amount,
        received: tossPayment.totalAmount,
      }, { status: 400 })
    }
  }

  // 결제 완료 처리
  const { error: updateError } = await supabase
    .from('campaign_payments')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      toss_payment_key: paymentKey || null,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('[Toss Webhook] Update failed:', updateError)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // 캠페인 상태 활성화
  await supabase
    .from('campaigns')
    .update({ status: 'recruiting' })
    .eq('id', payment.campaign_id)
    .eq('status', 'pending')

  console.log(`[Toss Webhook] Payment confirmed: ${orderId}, Amount: ${payment.total_amount}`)

  // 알림 발송 (옵션)
  // await sendPaymentConfirmationNotification(payment)

  return NextResponse.json({
    success: true,
    message: 'Payment confirmed',
    paymentId: payment.id,
  })
}

/**
 * 결제 취소 처리
 */
async function cancelPayment(orderId: string) {
  const { error } = await supabase
    .from('campaign_payments')
    .update({
      payment_status: 'cancelled',
    })
    .eq('id', orderId)
    .eq('payment_status', 'pending')

  if (error) {
    console.error('[Toss Webhook] Cancel failed:', error)
    return NextResponse.json({ error: 'Cancel failed' }, { status: 500 })
  }

  console.log(`[Toss Webhook] Payment cancelled: ${orderId}`)

  return NextResponse.json({
    success: true,
    message: 'Payment cancelled',
  })
}

/**
 * 웹훅 상태 확인
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/payments/toss/webhook',
    description: '토스페이먼츠 가상계좌 입금 웹훅',
    events: ['PAYMENT_STATUS_CHANGED', 'DEPOSIT_CALLBACK'],
    documentation: 'https://docs.tosspayments.com/guides/webhook',
  })
}
