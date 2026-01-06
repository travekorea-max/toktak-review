/**
 * 결제 웹훅 API
 * POST /api/payments/webhook - PG사 입금 알림 수신
 *
 * 지원 PG사:
 * - toss: 토스페이먼츠
 * - nice: 나이스페이
 * - inicis: KG이니시스
 *
 * 가상계좌 입금 시 PG사에서 이 엔드포인트로 알림을 보냄
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PG사 시크릿 키 (환경변수로 관리)
const PG_SECRET_KEY = process.env.PG_SECRET_KEY || 'test-secret-key'

// 웹훅 서명 검증
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-webhook-signature') || ''
    const pgProvider = request.headers.get('x-pg-provider') || 'toss'

    // 프로덕션에서는 서명 검증 필수
    if (process.env.NODE_ENV === 'production') {
      if (!verifyWebhookSignature(body, signature, PG_SECRET_KEY)) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(body)

    // PG사별 데이터 파싱
    let paymentInfo: {
      orderId: string          // 주문번호 (payment.id)
      accountNumber: string    // 입금된 가상계좌 번호
      amount: number           // 입금 금액
      depositorName: string    // 입금자명
      depositedAt: string      // 입금 시각
    }

    switch (pgProvider) {
      case 'toss':
        // 토스페이먼츠 형식
        paymentInfo = {
          orderId: data.orderId,
          accountNumber: data.virtualAccount?.accountNumber,
          amount: data.totalAmount,
          depositorName: data.virtualAccount?.customerName || '',
          depositedAt: data.approvedAt,
        }
        break

      case 'nice':
        // 나이스페이 형식
        paymentInfo = {
          orderId: data.Moid,
          accountNumber: data.VbankNum,
          amount: parseInt(data.Amt),
          depositorName: data.BuyerName || '',
          depositedAt: new Date().toISOString(),
        }
        break

      case 'inicis':
        // KG이니시스 형식
        paymentInfo = {
          orderId: data.oid,
          accountNumber: data.vacct,
          amount: parseInt(data.price),
          depositorName: data.buyerName || '',
          depositedAt: new Date().toISOString(),
        }
        break

      default:
        // 기본/테스트 형식
        paymentInfo = {
          orderId: data.paymentId || data.orderId,
          accountNumber: data.accountNumber,
          amount: data.amount,
          depositorName: data.depositorName || '',
          depositedAt: data.depositedAt || new Date().toISOString(),
        }
    }

    console.log(`[Webhook] 입금 알림 수신 - PG: ${pgProvider}`, paymentInfo)

    // 결제 정보 조회
    const { data: payment, error: fetchError } = await supabase
      .from('campaign_payments')
      .select('id, campaign_id, total_amount, payment_status, virtual_account_number')
      .eq('id', paymentInfo.orderId)
      .single()

    if (fetchError || !payment) {
      console.error('Payment not found:', paymentInfo.orderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // 이미 처리된 결제인지 확인
    if (payment.payment_status === 'paid') {
      console.log('Payment already confirmed:', paymentInfo.orderId)
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // 금액 검증
    if (payment.total_amount !== paymentInfo.amount) {
      console.error('Amount mismatch:', {
        expected: payment.total_amount,
        received: paymentInfo.amount,
      })

      // 금액 불일치 알림 저장 (관리자가 수동 확인)
      await supabase.from('payment_logs').insert({
        payment_id: payment.id,
        event_type: 'amount_mismatch',
        event_data: {
          expected: payment.total_amount,
          received: paymentInfo.amount,
          depositorName: paymentInfo.depositorName,
        },
      }).catch(() => {}) // 로그 테이블 없어도 무시

      return NextResponse.json({
        error: 'Amount mismatch',
        expected: payment.total_amount,
        received: paymentInfo.amount,
      }, { status: 400 })
    }

    // 결제 완료 처리
    const { error: updateError } = await supabase
      .from('campaign_payments')
      .update({
        payment_status: 'paid',
        paid_at: paymentInfo.depositedAt,
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('Failed to update payment:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    // 캠페인 상태 활성화 (pending → recruiting)
    await supabase
      .from('campaigns')
      .update({ status: 'recruiting' })
      .eq('id', payment.campaign_id)
      .eq('status', 'pending')

    console.log(`[Webhook] 입금 확인 완료 - Payment: ${payment.id}, Amount: ${paymentInfo.amount}`)

    // 성공 응답
    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      amount: paymentInfo.amount,
      message: 'Payment confirmed',
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 웹훅 상태 확인 (GET)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/payments/webhook',
    supportedProviders: ['toss', 'nice', 'inicis'],
    description: '가상계좌 입금 알림 웹훅 엔드포인트',
  })
}
