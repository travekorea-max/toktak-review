'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  XCircle,
  Search,
  DollarSign,
  Clock,
  CreditCard,
  Building2,
  Eye,
  FileText,
  TrendingUp,
  Copy,
  Check,
  Zap,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Payment {
  id: string
  campaign_id: string
  client_id: string
  recruit_count: number
  reward_point_total: number
  agency_fee_total: number
  base_amount: number
  surcharge_rate: number
  surcharge_amount: number
  supply_price: number
  vat_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  tax_invoice_email: string | null
  virtual_bank_name: string | null
  virtual_account_number: string | null
  virtual_account_holder: string | null
  virtual_account_due_date: string | null
  paid_at: string | null
  created_at: string
  campaigns: {
    title: string
    product_name: string
    status: string
  }
  users: {
    email: string
  }
}

const tabs = [
  { id: 'pending', label: '입금대기' },
  { id: 'paid', label: '결제완료' },
  { id: 'cancelled', label: '취소' },
  { id: 'all', label: '전체' },
]

export default function AdminPaymentsPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'cancel'>('confirm')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('campaign_payments')
        .select(`
          *,
          campaigns (
            title,
            product_name,
            status
          ),
          users:client_id (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments((data as any) || [])
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetail = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowDetailDialog(true)
  }

  const handleAction = (payment: Payment, action: 'confirm' | 'cancel') => {
    setSelectedPayment(payment)
    setConfirmAction(action)
    setShowConfirmDialog(true)
  }

  const processAction = async () => {
    if (!selectedPayment) return

    try {
      setIsProcessing(true)

      const newStatus = confirmAction === 'confirm' ? 'paid' : 'cancelled'
      const updateData: any = {
        payment_status: newStatus,
      }

      if (confirmAction === 'confirm') {
        updateData.paid_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('campaign_payments')
        .update(updateData)
        .eq('id', selectedPayment.id)

      if (error) throw error

      // 결제 확인 시 캠페인 상태도 업데이트
      if (confirmAction === 'confirm') {
        await supabase
          .from('campaigns')
          .update({ status: 'recruiting' })
          .eq('id', selectedPayment.campaign_id)
          .eq('status', 'pending')
      }

      alert(
        confirmAction === 'confirm'
          ? '입금이 확인되었습니다. 캠페인이 활성화됩니다.'
          : '결제가 취소되었습니다.'
      )

      setShowConfirmDialog(false)
      setShowDetailDialog(false)
      setSelectedPayment(null)
      fetchPayments()
    } catch (err) {
      console.error('Error processing payment:', err)
      alert('처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  // 입금 시뮬레이션 (테스트용)
  const simulateDeposit = async (payment: Payment) => {
    if (!confirm(`[테스트] ${payment.campaigns?.title}\n${payment.total_amount.toLocaleString()}원 입금을 시뮬레이션하시겠습니까?`)) {
      return
    }

    try {
      setIsProcessing(true)

      const response = await fetch('/api/payments/simulate-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          depositorName: '자동입금테스트',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Simulation failed')
      }

      alert('입금 시뮬레이션 완료!\n캠페인이 자동으로 활성화되었습니다.')
      fetchPayments()
    } catch (err: any) {
      console.error('Simulation error:', err)
      alert('시뮬레이션 실패: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const getFilteredPayments = () => {
    let filtered = payments

    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.payment_status === activeTab)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.campaigns?.title?.toLowerCase().includes(query) ||
        (p.users as any)?.email?.toLowerCase().includes(query) ||
        p.virtual_account_number?.includes(searchQuery)
      )
    }

    return filtered
  }

  const filteredPayments = getFilteredPayments()

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.payment_status === 'pending').length,
    paid: payments.filter(p => p.payment_status === 'paid').length,
    cancelled: payments.filter(p => p.payment_status === 'cancelled').length,
    totalRevenue: payments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.total_amount, 0),
    pendingRevenue: payments
      .filter(p => p.payment_status === 'pending')
      .reduce((sum, p) => sum + p.total_amount, 0),
    totalAgencyFee: payments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.agency_fee_total, 0),
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
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
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">결제 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              광고주 캠페인 결제를 관리하세요
            </p>
          </div>
          <Link href="/admin/payments/report">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              매출 리포트
            </Button>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm text-gray-500">입금 대기</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}건</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.pendingRevenue)} 예정</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">결제 완료</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.paid}건</p>
            <p className="text-xs text-gray-500 mt-1">총 {formatCurrency(stats.totalRevenue)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">플랫폼 수수료</span>
            </div>
            <p className="text-2xl font-bold text-[#4F46E5]">{formatCurrency(stats.totalAgencyFee)}</p>
            <p className="text-xs text-gray-500 mt-1">순수익 (리뷰어 포인트 제외)</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500">전체 결제</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}건</p>
            <p className="text-xs text-gray-500 mt-1">취소: {stats.cancelled}건</p>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="캠페인명, 이메일, 계좌번호 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${activeTab === tab.id ? 'text-white/80' : 'text-gray-400'}`}>
                {tab.id === 'all' ? stats.total :
                 tab.id === 'pending' ? stats.pending :
                 tab.id === 'paid' ? stats.paid : stats.cancelled}
              </span>
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">
            <div className="col-span-1">요청일</div>
            <div className="col-span-3">캠페인</div>
            <div className="col-span-2">광고주</div>
            <div className="col-span-1">결제수단</div>
            <div className="col-span-1 text-right">모집인원</div>
            <div className="col-span-2 text-right">결제금액</div>
            <div className="col-span-1">상태</div>
            <div className="col-span-1 text-right">작업</div>
          </div>

          {/* 목록 */}
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">결제 내역이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-1 text-xs text-gray-500">
                    {format(new Date(payment.created_at), 'MM/dd HH:mm', { locale: ko })}
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{payment.campaigns?.title}</p>
                    <p className="text-xs text-gray-500 truncate">{payment.campaigns?.product_name}</p>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600 truncate">
                    {(payment.users as any)?.email}
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      payment.payment_method === 'bank_transfer'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      {payment.payment_method === 'bank_transfer' ? (
                        <>
                          <Building2 className="w-3 h-3" />
                          무통장
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3 h-3" />
                          카드
                        </>
                      )}
                    </span>
                  </div>
                  <div className="col-span-1 text-right text-sm text-gray-900">
                    {payment.recruit_count}명
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(payment.total_amount)}
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      payment.payment_status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      payment.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {payment.payment_status === 'pending' && '입금대기'}
                      {payment.payment_status === 'paid' && '결제완료'}
                      {payment.payment_status === 'cancelled' && '취소됨'}
                      {payment.payment_status === 'refunded' && '환불됨'}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetail(payment)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {payment.payment_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(payment, 'confirm')}
                        >
                          입금확인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => simulateDeposit(payment)}
                          disabled={isProcessing}
                          title="입금 시뮬레이션 (테스트용)"
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상세 다이얼로그 */}
      {showDetailDialog && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">결제 상세 정보</h2>
              <button
                onClick={() => setShowDetailDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 캠페인 정보 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">캠페인 정보</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">캠페인명</span>
                  </div>
                  <div className="font-medium text-gray-900">{selectedPayment.campaigns?.title}</div>
                  <div>
                    <span className="text-gray-500">제품명</span>
                  </div>
                  <div className="text-gray-900">{selectedPayment.campaigns?.product_name}</div>
                  <div>
                    <span className="text-gray-500">광고주</span>
                  </div>
                  <div className="text-gray-900">{(selectedPayment.users as any)?.email}</div>
                  <div>
                    <span className="text-gray-500">모집인원</span>
                  </div>
                  <div className="text-gray-900">{selectedPayment.recruit_count}명</div>
                </div>
              </div>

              {/* 결제 금액 상세 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">결제 금액 상세</h4>
                <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">리뷰어 포인트 합계</span>
                    <span>{formatCurrency(selectedPayment.reward_point_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">플랫폼 수수료 ({selectedPayment.recruit_count}명 × 3,000원)</span>
                    <span>{formatCurrency(selectedPayment.agency_fee_total)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-600">기본 금액</span>
                    <span>{formatCurrency(selectedPayment.base_amount)}</span>
                  </div>
                  {selectedPayment.surcharge_amount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>카드 수수료 ({(selectedPayment.surcharge_rate * 100).toFixed(1)}%)</span>
                      <span>+{formatCurrency(selectedPayment.surcharge_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">공급가액</span>
                    <span>{formatCurrency(selectedPayment.supply_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">부가세 (10%)</span>
                    <span>{formatCurrency(selectedPayment.vat_amount)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>총 결제 금액</span>
                    <span className="text-[#4F46E5]">{formatCurrency(selectedPayment.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* 결제 수단 정보 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">결제 수단</h4>
                <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">결제 방식</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedPayment.payment_method === 'bank_transfer'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      {selectedPayment.payment_method === 'bank_transfer' ? '무통장' : '카드'}
                    </span>
                  </div>
                  {selectedPayment.payment_method === 'bank_transfer' && selectedPayment.virtual_account_number && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">입금 은행</span>
                        <span>{selectedPayment.virtual_bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">계좌 번호</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{selectedPayment.virtual_account_number}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(selectedPayment.virtual_account_number!)}
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">예금주</span>
                        <span>{selectedPayment.virtual_account_holder}</span>
                      </div>
                      {selectedPayment.virtual_account_due_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">입금 기한</span>
                          <span className="text-orange-600">
                            {format(new Date(selectedPayment.virtual_account_due_date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {selectedPayment.tax_invoice_email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">세금계산서 이메일</span>
                      <span>{selectedPayment.tax_invoice_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 상태 정보 */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600">결제 상태</p>
                  <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedPayment.payment_status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    selectedPayment.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {selectedPayment.payment_status === 'pending' && '입금대기'}
                    {selectedPayment.payment_status === 'paid' && '결제완료'}
                    {selectedPayment.payment_status === 'cancelled' && '취소됨'}
                    {selectedPayment.payment_status === 'refunded' && '환불됨'}
                  </span>
                </div>
                {selectedPayment.paid_at && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">결제 완료일</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(selectedPayment.paid_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </p>
                  </div>
                )}
              </div>

              {/* 버튼 */}
              {selectedPayment.payment_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAction(selectedPayment, 'cancel')}
                  >
                    결제 취소
                  </Button>
                  <Button
                    className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA]"
                    onClick={() => handleAction(selectedPayment, 'confirm')}
                  >
                    입금 확인
                  </Button>
                </div>
              )}
              {selectedPayment.payment_status !== 'pending' && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                    닫기
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 확인 다이얼로그 */}
      {showConfirmDialog && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {confirmAction === 'confirm' ? '입금 확인' : '결제 취소'}
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">캠페인</span>
                  <span className="font-medium text-gray-900">{selectedPayment.campaigns?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제 금액</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(selectedPayment.total_amount)}</span>
                </div>
              </div>
              {confirmAction === 'confirm' && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-700">입금 확인 시 캠페인이 자동으로 활성화됩니다.</p>
                </div>
              )}
              {confirmAction === 'cancel' && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl">
                  <p className="text-sm text-red-700">결제를 취소하면 해당 캠페인은 결제 대기 상태로 유지됩니다.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                취소
              </Button>
              <Button
                className={`flex-1 ${confirmAction === 'cancel' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}
                onClick={processAction}
                disabled={isProcessing}
              >
                {isProcessing ? '처리 중...' : confirmAction === 'confirm' ? '입금 확인' : '결제 취소'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
