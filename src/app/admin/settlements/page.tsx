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
import { CheckCircle, XCircle, Search, DollarSign, Users, Clock, CreditCard } from 'lucide-react'
import { Database } from '@/types/database'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row']

export default function SettlementsPage() {
  const supabase = createClient()
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'complete'>('approve')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setWithdrawals(data || [])
    } catch (err) {
      console.error('Error fetching withdrawals:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = (withdrawal: WithdrawalRequest, action: 'approve' | 'reject' | 'complete') => {
    setSelectedWithdrawal(withdrawal)
    setConfirmAction(action)
    setShowConfirmDialog(true)
  }

  const processAction = async () => {
    if (!selectedWithdrawal) return

    try {
      setIsProcessing(true)

      let newStatus: string
      let completedAt: string | null = null

      switch (confirmAction) {
        case 'approve':
          newStatus = 'approved'
          break
        case 'reject':
          newStatus = 'rejected'
          break
        case 'complete':
          newStatus = 'completed'
          completedAt = new Date().toISOString()
          break
        default:
          return
      }

      const updateData: any = { status: newStatus }
      if (completedAt) {
        updateData.completed_at = completedAt
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', selectedWithdrawal.id)

      if (error) throw error

      alert(
        confirmAction === 'approve' ? '출금 요청이 승인되었습니다' :
        confirmAction === 'reject' ? '출금 요청이 거절되었습니다' :
        '출금이 완료 처리되었습니다'
      )

      setShowConfirmDialog(false)
      setSelectedWithdrawal(null)
      fetchWithdrawals()
    } catch (err) {
      console.error('Error processing withdrawal:', err)
      alert('처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const getFilteredWithdrawals = () => {
    let filtered = withdrawals

    if (activeTab !== 'all') {
      filtered = filtered.filter(w => w.status === activeTab)
    }

    if (searchQuery) {
      filtered = filtered.filter(w =>
        w.bank_holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.bank_account.includes(searchQuery)
      )
    }

    return filtered
  }

  const filteredWithdrawals = getFilteredWithdrawals()

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    totalAmount: withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.net_amount, 0),
    pendingAmount: withdrawals
      .filter(w => w.status === 'pending' || w.status === 'approved')
      .reduce((sum, w) => sum + w.net_amount, 0),
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">대기중</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">승인됨</Badge>
      case 'completed':
        return <Badge className="bg-green-500">완료</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600">거절</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">정산 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            리뷰어 출금 요청을 관리하세요
          </p>
        </div>
        <Link href="/admin/settlements/reviewers">
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            리뷰어별 정산 현황
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              대기중 출금
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}건</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {stats.pendingAmount.toLocaleString()}원 예정
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <CheckCircle className="w-3 h-3" />
              승인됨
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.approved}건</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <CreditCard className="w-3 h-3" />
              완료된 출금
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}건</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              총 {stats.totalAmount.toLocaleString()}원
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              전체 요청
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}건</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 검색 */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="예금주명 또는 계좌번호 검색..."
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
            대기중 ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            승인됨 ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="completed">
            완료 ({stats.completed})
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
                    <TableHead>예금주</TableHead>
                    <TableHead>은행/계좌</TableHead>
                    <TableHead className="text-right">출금액</TableHead>
                    <TableHead className="text-right">수수료</TableHead>
                    <TableHead className="text-right">실지급액</TableHead>
                    <TableHead>예정일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        로딩 중...
                      </TableCell>
                    </TableRow>
                  ) : filteredWithdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                        출금 요청이 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          {format(new Date(withdrawal.created_at), 'MM/dd HH:mm', { locale: ko })}
                        </TableCell>
                        <TableCell className="font-medium">{withdrawal.bank_holder}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{withdrawal.bank_name}</div>
                            <div className="text-gray-500">{withdrawal.bank_account}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {withdrawal.amount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          -{withdrawal.fee.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {withdrawal.net_amount.toLocaleString()}원
                        </TableCell>
                        <TableCell>
                          {format(new Date(withdrawal.scheduled_date), 'MM/dd', { locale: ko })}
                        </TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell className="text-right">
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleAction(withdrawal, 'approve')}
                              >
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(withdrawal, 'reject')}
                              >
                                거절
                              </Button>
                            </div>
                          )}
                          {withdrawal.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(withdrawal, 'complete')}
                            >
                              완료처리
                            </Button>
                          )}
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

      {/* 확인 다이얼로그 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve' && '출금 승인'}
              {confirmAction === 'reject' && '출금 거절'}
              {confirmAction === 'complete' && '출금 완료 처리'}
            </DialogTitle>
            <DialogDescription>
              {selectedWithdrawal && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span>예금주:</span>
                    <span className="font-medium">{selectedWithdrawal.bank_holder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>계좌:</span>
                    <span>{selectedWithdrawal.bank_name} {selectedWithdrawal.bank_account}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>실지급액:</span>
                    <span className="font-bold text-lg">{selectedWithdrawal.net_amount.toLocaleString()}원</span>
                  </div>
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
              variant={confirmAction === 'reject' ? 'destructive' : 'default'}
            >
              {isProcessing ? '처리 중...' : '확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
