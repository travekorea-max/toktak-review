/**
 * 매출 리포트 API (플랫폼 대행 수수료)
 * GET /api/admin/settlements/revenue
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { formatNumber } from '@/lib/billing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 기본값: 최근 12개월
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 12)

    const start = startDate || defaultStartDate.toISOString().split('T')[0]
    const end = endDate || defaultEndDate.toISOString().split('T')[0]

    // 결제 완료된 캠페인에서 대행 수수료 합산
    const { data: payments, error } = await supabase
      .from('campaign_payments')
      .select(`
        paid_at,
        agency_fee_total,
        reward_point_total,
        supply_price,
        vat_amount,
        total_amount
      `)
      .eq('payment_status', 'paid')
      .gte('paid_at', start)
      .lte('paid_at', end)
      .order('paid_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 월별 집계
    const monthlyData: Record<string, {
      month: string
      campaignCount: number
      agencyFeeTotal: number
      rewardPointTotal: number
      supplyPrice: number
      vatAmount: number
      totalAmount: number
    }> = {}

    payments?.forEach(payment => {
      const month = payment.paid_at.substring(0, 7) // YYYY-MM

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          campaignCount: 0,
          agencyFeeTotal: 0,
          rewardPointTotal: 0,
          supplyPrice: 0,
          vatAmount: 0,
          totalAmount: 0,
        }
      }

      monthlyData[month].campaignCount += 1
      monthlyData[month].agencyFeeTotal += payment.agency_fee_total
      monthlyData[month].rewardPointTotal += payment.reward_point_total
      monthlyData[month].supplyPrice += payment.supply_price
      monthlyData[month].vatAmount += payment.vat_amount
      monthlyData[month].totalAmount += payment.total_amount
    })

    // 배열로 변환 및 정렬
    const report = Object.values(monthlyData).sort(
      (a, b) => b.month.localeCompare(a.month)
    )

    // 합계
    const totals = report.reduce(
      (acc, row) => ({
        campaignCount: acc.campaignCount + row.campaignCount,
        agencyFeeTotal: acc.agencyFeeTotal + row.agencyFeeTotal,
        rewardPointTotal: acc.rewardPointTotal + row.rewardPointTotal,
        supplyPrice: acc.supplyPrice + row.supplyPrice,
        vatAmount: acc.vatAmount + row.vatAmount,
        totalAmount: acc.totalAmount + row.totalAmount,
      }),
      {
        campaignCount: 0,
        agencyFeeTotal: 0,
        rewardPointTotal: 0,
        supplyPrice: 0,
        vatAmount: 0,
        totalAmount: 0,
      }
    )

    return NextResponse.json({
      period: { start, end },
      report,
      totals,
      summary: {
        platformRevenue: formatNumber(totals.agencyFeeTotal) + '원',
        totalBilling: formatNumber(totals.totalAmount) + '원',
        campaignCount: totals.campaignCount + '건',
      },
    })
  } catch (error) {
    console.error('Revenue report error:', error)
    return NextResponse.json(
      { error: '매출 리포트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
