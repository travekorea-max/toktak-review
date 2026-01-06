/**
 * 원천세 신고 데이터 API
 * GET /api/admin/settlements/tax-report
 *
 * 월별 출금 완료 유저들의 세무 신고용 데이터를 추출합니다.
 * - 이름, 주민번호(복호화), 지급총액, 공제세액(3.3%)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decrypt, maskRRN, formatNumber } from '@/lib/billing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') // YYYY-MM 형식
    const includeRRN = searchParams.get('includeRRN') === 'true' // 주민번호 복호화 포함 여부

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: 'period 파라미터가 필요합니다. (형식: YYYY-MM)' },
        { status: 400 }
      )
    }

    // 해당 월의 출금 완료 데이터 조회
    const startOfMonth = `${period}-01`
    const endOfMonth = new Date(
      parseInt(period.split('-')[0]),
      parseInt(period.split('-')[1]),
      0
    ).toISOString().split('T')[0]

    const { data: withdrawals, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        id,
        reviewer_id,
        gross_amount,
        withholding_tax,
        actual_payout,
        amount,
        fee,
        net_amount,
        completed_at,
        tax_reported,
        reviewer_profiles!inner(name, user_id),
        reviewer_tax_info(encrypted_rrn, legal_name)
      `)
      .eq('status', 'completed')
      .gte('completed_at', startOfMonth)
      .lte('completed_at', endOfMonth + 'T23:59:59.999Z')
      .order('completed_at', { ascending: true })

    if (error) {
      console.error('Tax report query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 리뷰어별 집계
    const reviewerData: Record<string, {
      reviewerId: string
      name: string
      legalName: string | null
      rrn: string | null
      maskedRrn: string | null
      grossAmountTotal: number
      withholdingTaxTotal: number
      actualPayoutTotal: number
      withdrawalCount: number
      withdrawalIds: string[]
      taxReported: boolean
    }> = {}

    for (const w of withdrawals || []) {
      const reviewerId = w.reviewer_id
      const profile = w.reviewer_profiles as any
      const taxInfo = w.reviewer_tax_info as any

      if (!reviewerData[reviewerId]) {
        let decryptedRrn: string | null = null
        let maskedRrnValue: string | null = null

        // 주민번호 복호화 (요청 시에만)
        if (taxInfo?.encrypted_rrn) {
          try {
            if (includeRRN) {
              decryptedRrn = decrypt(taxInfo.encrypted_rrn)
            }
            // 복호화해서 마스킹 처리
            const tempDecrypted = decrypt(taxInfo.encrypted_rrn)
            maskedRrnValue = maskRRN(tempDecrypted)
          } catch {
            maskedRrnValue = '복호화 오류'
          }
        }

        reviewerData[reviewerId] = {
          reviewerId,
          name: profile?.name || '알 수 없음',
          legalName: taxInfo?.legal_name || null,
          rrn: decryptedRrn,
          maskedRrn: maskedRrnValue,
          grossAmountTotal: 0,
          withholdingTaxTotal: 0,
          actualPayoutTotal: 0,
          withdrawalCount: 0,
          withdrawalIds: [],
          taxReported: true,
        }
      }

      // 새 컬럼이 있으면 사용, 없으면 기존 컬럼 사용
      const gross = w.gross_amount ?? w.amount
      const tax = w.withholding_tax ?? w.fee
      const payout = w.actual_payout ?? w.net_amount

      reviewerData[reviewerId].grossAmountTotal += gross
      reviewerData[reviewerId].withholdingTaxTotal += tax
      reviewerData[reviewerId].actualPayoutTotal += payout
      reviewerData[reviewerId].withdrawalCount += 1
      reviewerData[reviewerId].withdrawalIds.push(w.id)

      // 하나라도 미신고면 false
      if (!w.tax_reported) {
        reviewerData[reviewerId].taxReported = false
      }
    }

    const report = Object.values(reviewerData).map(r => ({
      ...r,
      grossAmountFormatted: formatNumber(r.grossAmountTotal) + '원',
      withholdingTaxFormatted: formatNumber(r.withholdingTaxTotal) + '원',
      actualPayoutFormatted: formatNumber(r.actualPayoutTotal) + '원',
    }))

    // 합계
    const totals = report.reduce(
      (acc, row) => ({
        reviewerCount: acc.reviewerCount + 1,
        grossAmountTotal: acc.grossAmountTotal + row.grossAmountTotal,
        withholdingTaxTotal: acc.withholdingTaxTotal + row.withholdingTaxTotal,
        actualPayoutTotal: acc.actualPayoutTotal + row.actualPayoutTotal,
        withdrawalCount: acc.withdrawalCount + row.withdrawalCount,
      }),
      {
        reviewerCount: 0,
        grossAmountTotal: 0,
        withholdingTaxTotal: 0,
        actualPayoutTotal: 0,
        withdrawalCount: 0,
      }
    )

    // 미신고 건수
    const unreportedCount = report.filter(r => !r.taxReported).length

    return NextResponse.json({
      period,
      report,
      totals: {
        ...totals,
        unreportedCount,
      },
      summary: {
        period: `${period}월`,
        reviewerCount: totals.reviewerCount + '명',
        grossAmount: formatNumber(totals.grossAmountTotal) + '원',
        withholdingTax: formatNumber(totals.withholdingTaxTotal) + '원',
        unreportedCount: unreportedCount + '건',
      },
    })
  } catch (error) {
    console.error('Tax report error:', error)
    return NextResponse.json(
      { error: '원천세 신고 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 세무 신고 완료 처리
 * POST /api/admin/settlements/tax-report
 */
export async function POST(request: NextRequest) {
  try {
    const { withdrawalIds, period } = await request.json()

    if (!withdrawalIds || !Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
      return NextResponse.json(
        { error: 'withdrawalIds 배열이 필요합니다.' },
        { status: 400 }
      )
    }

    // 신고 완료 처리
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        tax_reported: true,
        tax_reported_at: new Date().toISOString(),
        tax_report_period: period || null,
      })
      .in('id', withdrawalIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${withdrawalIds.length}건의 출금 건이 세무 신고 완료 처리되었습니다.`,
    })
  } catch (error) {
    console.error('Tax report update error:', error)
    return NextResponse.json(
      { error: '세무 신고 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
