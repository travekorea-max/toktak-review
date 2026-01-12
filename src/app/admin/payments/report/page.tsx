'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  Download,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MonthlyStats {
  month: string
  totalRevenue: number
  paidCount: number
  pendingCount: number
  cancelledCount: number
  bankTransferRevenue: number
  cardRevenue: number
  agencyFeeTotal: number
  rewardPointTotal: number
  vatTotal: number
}

interface Payment {
  id: string
  total_amount: number
  agency_fee_total: number
  reward_point_total: number
  vat_amount: number
  payment_method: string
  payment_status: string
  paid_at: string | null
  created_at: string
}

const years = Array.from({ length: 3 }, (_, i) => (new Date().getFullYear() - i).toString())

export default function PaymentReportPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    fetchPayments()
  }, [selectedYear])

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      const startDate = `${selectedYear}-01-01`
      const endDate = `${selectedYear}-12-31`

      const { data, error } = await supabase
        .from('campaign_payments')
        .select('id, total_amount, agency_fee_total, reward_point_total, vat_amount, payment_method, payment_status, paid_at, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 월별 통계 계산
  const calculateMonthlyStats = (): MonthlyStats[] => {
    const months: MonthlyStats[] = []

    for (let i = 0; i < 12; i++) {
      const monthStr = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
      const monthPayments = payments.filter(p => p.created_at.startsWith(monthStr))
      const paidPayments = monthPayments.filter(p => p.payment_status === 'paid')

      months.push({
        month: monthStr,
        totalRevenue: paidPayments.reduce((sum, p) => sum + p.total_amount, 0),
        paidCount: paidPayments.length,
        pendingCount: monthPayments.filter(p => p.payment_status === 'pending').length,
        cancelledCount: monthPayments.filter(p => p.payment_status === 'cancelled').length,
        bankTransferRevenue: paidPayments
          .filter(p => p.payment_method === 'bank_transfer')
          .reduce((sum, p) => sum + p.total_amount, 0),
        cardRevenue: paidPayments
          .filter(p => p.payment_method === 'credit_card')
          .reduce((sum, p) => sum + p.total_amount, 0),
        agencyFeeTotal: paidPayments.reduce((sum, p) => sum + p.agency_fee_total, 0),
        rewardPointTotal: paidPayments.reduce((sum, p) => sum + p.reward_point_total, 0),
        vatTotal: paidPayments.reduce((sum, p) => sum + p.vat_amount, 0),
      })
    }

    return months.reverse()
  }

  const monthlyStats = calculateMonthlyStats()

  // 연간 총계
  const yearlyTotals = {
    totalRevenue: monthlyStats.reduce((sum, m) => sum + m.totalRevenue, 0),
    paidCount: monthlyStats.reduce((sum, m) => sum + m.paidCount, 0),
    pendingCount: monthlyStats.reduce((sum, m) => sum + m.pendingCount, 0),
    cancelledCount: monthlyStats.reduce((sum, m) => sum + m.cancelledCount, 0),
    bankTransferRevenue: monthlyStats.reduce((sum, m) => sum + m.bankTransferRevenue, 0),
    cardRevenue: monthlyStats.reduce((sum, m) => sum + m.cardRevenue, 0),
    agencyFeeTotal: monthlyStats.reduce((sum, m) => sum + m.agencyFeeTotal, 0),
    rewardPointTotal: monthlyStats.reduce((sum, m) => sum + m.rewardPointTotal, 0),
    vatTotal: monthlyStats.reduce((sum, m) => sum + m.vatTotal, 0),
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  const formatMonth = (monthStr: string) => {
    const date = parseISO(monthStr + '-01')
    return format(date, 'M월', { locale: ko })
  }

  const exportToCSV = () => {
    const headers = ['월', '총 매출', '결제 건수', '무통장 입금', '카드 결제', '플랫폼 수수료', '리뷰어 포인트', '부가세']
    const rows = monthlyStats.map(m => [
      formatMonth(m.month),
      m.totalRevenue,
      m.paidCount,
      m.bankTransferRevenue,
      m.cardRevenue,
      m.agencyFeeTotal,
      m.rewardPointTotal,
      m.vatTotal,
    ])

    rows.push([
      '총계',
      yearlyTotals.totalRevenue,
      yearlyTotals.paidCount,
      yearlyTotals.bankTransferRevenue,
      yearlyTotals.cardRevenue,
      yearlyTotals.agencyFeeTotal,
      yearlyTotals.rewardPointTotal,
      yearlyTotals.vatTotal,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `매출리포트_${selectedYear}.csv`
    link.click()
  }

  // 이번 달과 지난 달 비교
  const currentMonth = new Date().getMonth()
  const currentMonthStats = monthlyStats.find(m => m.month === `${selectedYear}-${String(currentMonth + 1).padStart(2, '0')}`)
  const lastMonthStats = monthlyStats.find(m => m.month === `${selectedYear}-${String(currentMonth).padStart(2, '0')}`)

  const revenueChange = currentMonthStats && lastMonthStats && lastMonthStats.totalRevenue > 0
    ? ((currentMonthStats.totalRevenue - lastMonthStats.totalRevenue) / lastMonthStats.totalRevenue * 100).toFixed(1)
    : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          결제 관리로 돌아가기
        </Link>

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">매출 리포트</h1>
            <p className="text-sm text-gray-500 mt-1">
              월별/연간 매출 현황을 확인하세요
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedYear === year
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {year}년
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV 다운로드
            </Button>
          </div>
        </div>

        {/* 연간 요약 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">{selectedYear}년 총 매출</span>
            </div>
            <p className="text-2xl font-bold text-[#4F46E5]">{formatCurrency(yearlyTotals.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">{yearlyTotals.paidCount}건 결제 완료</p>
            {revenueChange && (
              <div className={`flex items-center text-xs mt-2 ${parseFloat(revenueChange) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {parseFloat(revenueChange) >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                전월 대비 {revenueChange}%
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-gray-500">무통장 입금</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(yearlyTotals.bankTransferRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {yearlyTotals.totalRevenue > 0
                ? `${((yearlyTotals.bankTransferRevenue / yearlyTotals.totalRevenue) * 100).toFixed(1)}%`
                : '0%'
              } 비중
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-gray-500">카드 결제</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(yearlyTotals.cardRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {yearlyTotals.totalRevenue > 0
                ? `${((yearlyTotals.cardRevenue / yearlyTotals.totalRevenue) * 100).toFixed(1)}%`
                : '0%'
              } 비중
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">플랫폼 순수익</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(yearlyTotals.agencyFeeTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">리뷰어 포인트 제외</p>
          </div>
        </div>

        {/* 세부 내역 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-2">리뷰어 지급 포인트 총액</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(yearlyTotals.rewardPointTotal)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-2">부가세 총액</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(yearlyTotals.vatTotal)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-2">취소/대기 건수</p>
            <p className="text-xl font-bold text-gray-900">
              대기 {yearlyTotals.pendingCount}건 / 취소 {yearlyTotals.cancelledCount}건
            </p>
          </div>
        </div>

        {/* 월별 테이블 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">월별 매출 현황</h2>
          </div>

          {/* 헤더 */}
          <div className="grid grid-cols-8 gap-4 px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">
            <div>월</div>
            <div className="text-right">결제 건수</div>
            <div className="text-right">총 매출</div>
            <div className="text-right">무통장</div>
            <div className="text-right">카드</div>
            <div className="text-right">플랫폼 수수료</div>
            <div className="text-right">리뷰어 포인트</div>
            <div className="text-right">부가세</div>
          </div>

          {/* 목록 */}
          <div className="divide-y divide-gray-100">
            {monthlyStats.map((stat) => (
              <div
                key={stat.month}
                className={`grid grid-cols-8 gap-4 px-5 py-3 text-sm ${stat.totalRevenue === 0 ? 'text-gray-400' : ''}`}
              >
                <div className="font-medium text-gray-900">{formatMonth(stat.month)}</div>
                <div className="text-right">{stat.paidCount}건</div>
                <div className="text-right font-medium text-gray-900">{formatCurrency(stat.totalRevenue)}</div>
                <div className="text-right">{formatCurrency(stat.bankTransferRevenue)}</div>
                <div className="text-right">{formatCurrency(stat.cardRevenue)}</div>
                <div className="text-right text-emerald-600">{formatCurrency(stat.agencyFeeTotal)}</div>
                <div className="text-right">{formatCurrency(stat.rewardPointTotal)}</div>
                <div className="text-right">{formatCurrency(stat.vatTotal)}</div>
              </div>
            ))}
            {/* 총계 행 */}
            <div className="grid grid-cols-8 gap-4 px-5 py-3 bg-gray-50 text-sm font-bold border-t border-gray-200">
              <div className="text-gray-900">총계</div>
              <div className="text-right text-gray-900">{yearlyTotals.paidCount}건</div>
              <div className="text-right text-[#4F46E5]">{formatCurrency(yearlyTotals.totalRevenue)}</div>
              <div className="text-right">{formatCurrency(yearlyTotals.bankTransferRevenue)}</div>
              <div className="text-right">{formatCurrency(yearlyTotals.cardRevenue)}</div>
              <div className="text-right text-emerald-600">{formatCurrency(yearlyTotals.agencyFeeTotal)}</div>
              <div className="text-right">{formatCurrency(yearlyTotals.rewardPointTotal)}</div>
              <div className="text-right">{formatCurrency(yearlyTotals.vatTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
