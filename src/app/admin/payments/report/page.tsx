'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Building2,
  Users,
  FileText,
  Download,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns'
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

export default function PaymentReportPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const years = Array.from({ length: 3 }, (_, i) => (new Date().getFullYear() - i).toString())

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

    return months.reverse() // 최근 달부터 표시
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

    // 총계 행 추가
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/payments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">매출 리포트</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              월별/연간 매출 현황을 확인하세요
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="연도 선택" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}년</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV 다운로드
          </Button>
        </div>
      </div>

      {/* 연간 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              {selectedYear}년 총 매출
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {formatCurrency(yearlyTotals.totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {yearlyTotals.paidCount}건 결제 완료
            </div>
            {revenueChange && (
              <div className={`flex items-center text-sm mt-1 ${parseFloat(revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(revenueChange) >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                전월 대비 {revenueChange}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Building2 className="w-3 h-3" />
              무통장 입금
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(yearlyTotals.bankTransferRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {yearlyTotals.totalRevenue > 0
                ? `${((yearlyTotals.bankTransferRevenue / yearlyTotals.totalRevenue) * 100).toFixed(1)}%`
                : '0%'
              } 비중
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <CreditCard className="w-3 h-3" />
              카드 결제
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(yearlyTotals.cardRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              {yearlyTotals.totalRevenue > 0
                ? `${((yearlyTotals.cardRevenue / yearlyTotals.totalRevenue) * 100).toFixed(1)}%`
                : '0%'
              } 비중
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3" />
              플랫폼 순수익
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(yearlyTotals.agencyFeeTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              리뷰어 포인트 제외
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 세부 내역 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>리뷰어 지급 포인트 총액</CardDescription>
            <CardTitle className="text-xl">{formatCurrency(yearlyTotals.rewardPointTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>부가세 총액</CardDescription>
            <CardTitle className="text-xl">{formatCurrency(yearlyTotals.vatTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>취소/대기 건수</CardDescription>
            <CardTitle className="text-xl">
              대기 {yearlyTotals.pendingCount}건 / 취소 {yearlyTotals.cancelledCount}건
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 월별 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 매출 현황</CardTitle>
          <CardDescription>
            {selectedYear}년 월별 결제 현황입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>월</TableHead>
                <TableHead className="text-right">결제 건수</TableHead>
                <TableHead className="text-right">총 매출</TableHead>
                <TableHead className="text-right">무통장</TableHead>
                <TableHead className="text-right">카드</TableHead>
                <TableHead className="text-right">플랫폼 수수료</TableHead>
                <TableHead className="text-right">리뷰어 포인트</TableHead>
                <TableHead className="text-right">부가세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {monthlyStats.map((stat) => (
                    <TableRow key={stat.month} className={stat.totalRevenue === 0 ? 'text-gray-400' : ''}>
                      <TableCell className="font-medium">{formatMonth(stat.month)}</TableCell>
                      <TableCell className="text-right">{stat.paidCount}건</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(stat.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(stat.bankTransferRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(stat.cardRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(stat.agencyFeeTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(stat.rewardPointTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(stat.vatTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* 총계 행 */}
                  <TableRow className="bg-gray-50 dark:bg-gray-800 font-bold">
                    <TableCell>총계</TableCell>
                    <TableCell className="text-right">{yearlyTotals.paidCount}건</TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(yearlyTotals.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(yearlyTotals.bankTransferRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(yearlyTotals.cardRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(yearlyTotals.agencyFeeTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(yearlyTotals.rewardPointTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(yearlyTotals.vatTotal)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
