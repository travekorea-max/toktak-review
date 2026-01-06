/**
 * 매입(비용) 리포트 API (리뷰어 지급 포인트)
 * GET /api/admin/settlements/payout
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

    // 출금 완료된 요청 조회
    const { data: withdrawals, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        completed_at,
        gross_amount,
        withholding_tax,
        actual_payout,
        amount,
        fee,
        net_amount
      `)
      .eq('status', 'completed')
      .gte('completed_at', start)
      .lte('completed_at', end)
      .order('completed_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 월별 집계
    const monthlyData: Record<string, {
      month: string
      payoutCount: number
      grossAmountTotal: number
      withholdingTaxTotal: number
      actualPayoutTotal: number
    }> = {}

    withdrawals?.forEach(w => {
      const month = w.completed_at.substring(0, 7) // YYYY-MM

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          payoutCount: 0,
          grossAmountTotal: 0,
          withholdingTaxTotal: 0,
          actualPayoutTotal: 0,
        }
      }

      // 새 컬럼이 있으면 사용, 없으면 기존 컬럼 사용
      const gross = w.gross_amount ?? w.amount
      const tax = w.withholding_tax ?? w.fee
      const payout = w.actual_payout ?? w.net_amount

      monthlyData[month].payoutCount += 1
      monthlyData[month].grossAmountTotal += gross
      monthlyData[month].withholdingTaxTotal += tax
      monthlyData[month].actualPayoutTotal += payout
    })

    // 배열로 변환 및 정렬
    const report = Object.values(monthlyData).sort(
      (a, b) => b.month.localeCompare(a.month)
    )

    // 합계
    const totals = report.reduce(
      (acc, row) => ({
        payoutCount: acc.payoutCount + row.payoutCount,
        grossAmountTotal: acc.grossAmountTotal + row.grossAmountTotal,
        withholdingTaxTotal: acc.withholdingTaxTotal + row.withholdingTaxTotal,
        actualPayoutTotal: acc.actualPayoutTotal + row.actualPayoutTotal,
      }),
      {
        payoutCount: 0,
        grossAmountTotal: 0,
        withholdingTaxTotal: 0,
        actualPayoutTotal: 0,
      }
    )

    return NextResponse.json({
      period: { start, end },
      report,
      totals,
      summary: {
        grossAmount: formatNumber(totals.grossAmountTotal) + '원',
        withholdingTax: formatNumber(totals.withholdingTaxTotal) + '원',
        actualPayout: formatNumber(totals.actualPayoutTotal) + '원',
        payoutCount: totals.payoutCount + '건',
      },
    })
  } catch (error) {
    console.error('Payout report error:', error)
    return NextResponse.json(
      { error: '매입 리포트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
