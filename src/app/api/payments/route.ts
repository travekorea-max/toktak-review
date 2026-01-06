/**
 * 결제 API
 * POST /api/payments - 결제 생성
 * GET /api/payments - 결제 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateCampaignBilling, type PaymentMethodType } from '@/lib/billing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaignId,
      clientId,
      recruitCount,
      rewardPointPerPerson,
      paymentMethod,
      taxInvoiceEmail,
    } = body

    // 입력 검증
    if (!campaignId || !clientId || !recruitCount || !rewardPointPerPerson) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 결제 금액 계산
    const billing = calculateCampaignBilling({
      recruitCount,
      rewardPointPerPerson,
      paymentMethod: paymentMethod as PaymentMethodType || 'bank_transfer',
    })

    // 결제 정보 생성
    const { data: payment, error } = await supabase
      .from('campaign_payments')
      .insert({
        campaign_id: campaignId,
        client_id: clientId,
        recruit_count: billing.recruitCount,
        reward_point_total: billing.rewardPointTotal,
        agency_fee_total: billing.agencyFeeTotal,
        base_amount: billing.baseAmount,
        surcharge_rate: billing.surchargeRate,
        surcharge_amount: billing.surchargeAmount,
        supply_price: billing.supplyPrice,
        vat_amount: billing.vatAmount,
        total_amount: billing.totalAmount,
        payment_method: paymentMethod || 'bank_transfer',
        payment_status: 'pending',
        tax_invoice_email: taxInvoiceEmail || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Payment creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 무통장 입금인 경우 가상계좌 정보 생성 (실제로는 PG사 연동)
    if (paymentMethod === 'bank_transfer') {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 3) // 3일 후

      await supabase
        .from('campaign_payments')
        .update({
          virtual_bank_name: 'KB국민은행',
          virtual_account_number: `9${Date.now().toString().slice(-11)}`,
          virtual_account_holder: '(주)톡톡리뷰',
          virtual_account_due_date: dueDate.toISOString(),
        })
        .eq('id', payment.id)
    }

    return NextResponse.json({
      success: true,
      payment,
      billing: {
        ...billing,
        discountMessage: billing.discountFromCard
          ? `무통장 입금 시 ${billing.discountFromCard.toLocaleString()}원 할인`
          : null,
      },
    })
  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: '결제 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const clientId = searchParams.get('clientId')

    let query = supabase
      .from('campaign_payments')
      .select(`
        *,
        campaigns (
          id,
          title,
          product_name,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: payments, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Payment list error:', error)
    return NextResponse.json(
      { error: '결제 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
