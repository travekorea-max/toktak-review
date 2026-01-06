'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">입금대기</Badge>
      case 'paid':
        return <Badge className="bg-green-500">결제완료</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600">취소됨</Badge>
      case 'refunded':
        return <Badge variant="outline" className="text-gray-600">환불됨</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Building2 className="w-3 h-3 mr-1" />
            무통장
          </Badge>
        )
      case 'credit_card':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            <CreditCard className="w-3 h-3 mr-1" />
            카드
          </Badge>
        )
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">결제 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              입금 대기
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}건</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {formatCurrency(stats.pendingRevenue)} 예정
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <CheckCircle className="w-3 h-3" />
              결제 완료
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.paid}건</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              총 {formatCurrency(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              플랫폼 수수료
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {formatCurrency(stats.totalAgencyFee)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              순수익 (리뷰어 포인트 제외)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3" />
              전체 결제
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}건</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              취소: {stats.cancelled}건
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="캠페인명, 이메일, 계좌번호 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 탭 & 테이블 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            입금대기 ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="paid">
            결제완료 ({stats.paid})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            취소 ({stats.cancelled})
          </TabsTrigger>
          <TabsTrigger value="all">
            전체 ({stats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>요청일</TableHead>
                    <TableHead>캠페인</TableHead>
                    <TableHead>광고주</TableHead>
                    <TableHead>결제수단</TableHead>
                    <TableHead className="text-right">모집인원</TableHead>
                    <TableHead className="text-right">결제금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        로딩 중...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        결제 내역이 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.created_at), 'MM/dd HH:mm', { locale: ko })}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="font-medium truncate">
                              {payment.campaigns?.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {payment.campaigns?.product_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {(payment.users as any)?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(payment.payment_method)}
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.recruit_count}명
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.total_amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 상세 다이얼로그 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>결제 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* 캠페인 정보 */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">캠페인 정보</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>캠페인명:</div>
                  <div className="font-medium">{selectedPayment.campaigns?.title}</div>
                  <div>제품명:</div>
                  <div>{selectedPayment.campaigns?.product_name}</div>
                  <div>광고주:</div>
                  <div>{(selectedPayment.users as any)?.email}</div>
                  <div>모집인원:</div>
                  <div>{selectedPayment.recruit_count}명</div>
                </div>
              </div>

              {/* 결제 금액 상세 */}
              <div className="space-y-2">
                <h4 className="font-medium">결제 금액 상세</h4>
                <div className="border rounded-lg p-4 space-y-2 text-sm">
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
                    <span className="text-blue-600">{formatCurrency(selectedPayment.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* 결제 수단 정보 */}
              <div className="space-y-2">
                <h4 className="font-medium">결제 수단</h4>
                <div className="border rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">결제 방식</span>
                    {getPaymentMethodBadge(selectedPayment.payment_method)}
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
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">결제 상태</div>
                  <div className="mt-1">{getStatusBadge(selectedPayment.payment_status)}</div>
                </div>
                {selectedPayment.paid_at && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">결제 완료일</div>
                    <div className="font-medium">
                      {format(new Date(selectedPayment.paid_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedPayment?.payment_status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction(selectedPayment, 'cancel')}
                >
                  결제 취소
                </Button>
                <Button onClick={() => handleAction(selectedPayment, 'confirm')}>
                  입금 확인
                </Button>
              </>
            )}
            {selectedPayment?.payment_status !== 'pending' && (
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                닫기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 확인 다이얼로그 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'confirm' ? '입금 확인' : '결제 취소'}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span>캠페인:</span>
                    <span className="font-medium">{selectedPayment.campaigns?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>결제 금액:</span>
                    <span className="font-bold text-lg">{formatCurrency(selectedPayment.total_amount)}</span>
                  </div>
                  {confirmAction === 'confirm' && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-sm text-green-700">
                      입금 확인 시 캠페인이 자동으로 활성화됩니다.
                    </div>
                  )}
                  {confirmAction === 'cancel' && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-red-700">
                      결제를 취소하면 해당 캠페인은 결제 대기 상태로 유지됩니다.
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button
              onClick={processAction}
              disabled={isProcessing}
              variant={confirmAction === 'cancel' ? 'destructive' : 'default'}
            >
              {isProcessing ? '처리 중...' : confirmAction === 'confirm' ? '입금 확인' : '결제 취소'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
