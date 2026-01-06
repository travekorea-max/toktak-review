/**
 * 토스페이먼츠 결제 API
 * POST /api/payments/toss - 가상계좌 발급 요청
 * GET /api/payments/toss?paymentKey=xxx - 결제 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requestVirtualAccount, getPayment, BANK_NAMES, checkConfig } from '@/lib/payments/toss'
import { calculateCampaignBilling } from '@/lib/billing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 가상계좌 발급 요청
 */
export async function POST(request: NextRequest) {
  try {
    // 토스페이먼츠 설정 확인
    const config = checkConfig()
    if (!config.valid) {
      // 개발 모드에서는 시뮬레이션 모드로 동작
      if (process.env.NODE_ENV !== 'production') {
        return handleSimulationMode(request)
      }
      return NextResponse.json(
        { error: `토스페이먼츠 설정 누락: ${config.missing.join(', ')}` },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      campaignId,
      clientId,
      recruitCount,
      rewardPointPerPerson,
      bank = '04', // 기본: 국민은행
      customerName,
      customerEmail,
      taxInvoiceEmail,
    } = body

    // 입력 검증
    if (!campaignId || !clientId || !recruitCount || !rewardPointPerPerson) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 캠페인 정보 조회
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, title, product_name')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 결제 금액 계산 (무통장 입금)
    const billing = calculateCampaignBilling({
      recruitCount,
      rewardPointPerPerson,
      paymentMethod: 'bank_transfer',
    })

    // 결제 정보 먼저 생성 (orderId로 사용)
    const { data: payment, error: paymentError } = await supabase
      .from('campaign_payments')
      .insert({
        campaign_id: campaignId,
        client_id: clientId,
        recruit_count: billing.recruitCount,
        reward_point_total: billing.rewardPointTotal,
        agency_fee_total: billing.agencyFeeTotal,
        base_amount: billing.baseAmount,
        surcharge_rate: 0,
        surcharge_amount: 0,
        supply_price: billing.supplyPrice,
        vat_amount: billing.vatAmount,
        total_amount: billing.totalAmount,
        payment_method: 'bank_transfer',
        payment_status: 'pending',
        tax_invoice_email: taxInvoiceEmail || null,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    // 토스페이먼츠 가상계좌 요청
    const tossResult = await requestVirtualAccount({
      orderId: payment.id,
      orderName: `${campaign.title} 체험단 결제`,
      amount: billing.totalAmount,
      customerName: customerName || '광고주',
      customerEmail,
      bank,
      validHours: 72, // 3일
    })

    if (!tossResult.success) {
      // 토스 요청 실패 시 결제 정보 삭제
      await supabase.from('campaign_payments').delete().eq('id', payment.id)

      return NextResponse.json(
        { error: tossResult.error.message, code: tossResult.error.code },
        { status: 400 }
      )
    }

    // 가상계좌 정보 업데이트
    const virtualAccount = tossResult.payment.virtualAccount!
    const { error: updateError } = await supabase
      .from('campaign_payments')
      .update({
        virtual_bank_name: BANK_NAMES[virtualAccount.bankCode] || virtualAccount.bankCode,
        virtual_account_number: virtualAccount.accountNumber,
        virtual_account_holder: '(주)톡톡리뷰',
        virtual_account_due_date: virtualAccount.dueDate,
        toss_payment_key: tossResult.payment.paymentKey,
        toss_secret: tossResult.payment.secret,
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('Virtual account update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        totalAmount: billing.totalAmount,
        virtualAccount: {
          bankName: BANK_NAMES[virtualAccount.bankCode] || virtualAccount.bankCode,
          accountNumber: virtualAccount.accountNumber,
          holder: '(주)톡톡리뷰',
          dueDate: virtualAccount.dueDate,
        },
      },
      billing,
      tossPaymentKey: tossResult.payment.paymentKey,
    })

  } catch (error) {
    console.error('Toss payment API error:', error)
    return NextResponse.json(
      { error: '결제 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * 개발 모드 시뮬레이션
 */
async function handleSimulationMode(request: NextRequest) {
  const body = await request.json()
  const {
    campaignId,
    clientId,
    recruitCount,
    rewardPointPerPerson,
    bank = '04',
    taxInvoiceEmail,
  } = body

  // 캠페인 정보 조회
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, title')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
  }

  // 결제 금액 계산
  const billing = calculateCampaignBilling({
    recruitCount,
    rewardPointPerPerson,
    paymentMethod: 'bank_transfer',
  })

  // 결제 정보 생성
  const { data: payment, error: paymentError } = await supabase
    .from('campaign_payments')
    .insert({
      campaign_id: campaignId,
      client_id: clientId,
      recruit_count: billing.recruitCount,
      reward_point_total: billing.rewardPointTotal,
      agency_fee_total: billing.agencyFeeTotal,
      base_amount: billing.baseAmount,
      surcharge_rate: 0,
      surcharge_amount: 0,
      supply_price: billing.supplyPrice,
      vat_amount: billing.vatAmount,
      total_amount: billing.totalAmount,
      payment_method: 'bank_transfer',
      payment_status: 'pending',
      tax_invoice_email: taxInvoiceEmail || null,
      // 시뮬레이션 가상계좌
      virtual_bank_name: BANK_NAMES[bank] || 'KB국민은행',
      virtual_account_number: `9${Date.now().toString().slice(-11)}`,
      virtual_account_holder: '(주)톡톡리뷰',
      virtual_account_due_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    simulationMode: true,
    message: '개발 모드: 토스페이먼츠 시뮬레이션',
    payment: {
      id: payment.id,
      totalAmount: billing.totalAmount,
      virtualAccount: {
        bankName: payment.virtual_bank_name,
        accountNumber: payment.virtual_account_number,
        holder: payment.virtual_account_holder,
        dueDate: payment.virtual_account_due_date,
      },
    },
    billing,
  })
}

/**
 * 결제 조회
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentKey = searchParams.get('paymentKey')

  if (!paymentKey) {
    return NextResponse.json(
      { error: 'paymentKey가 필요합니다' },
      { status: 400 }
    )
  }

  const payment = await getPayment(paymentKey)

  if (!payment) {
    return NextResponse.json(
      { error: '결제 정보를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  return NextResponse.json({ payment })
}
