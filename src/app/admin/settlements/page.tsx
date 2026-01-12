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
  Users,
  Clock,
  CreditCard,
  X,
} from 'lucide-react'
import { Database } from '@/types/database'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row']

const tabs = [
  { id: 'pending', label: '대기중' },
  { id: 'approved', label: '승인됨' },
  { id: 'completed', label: '완료' },
  { id: 'all', label: '전체' },
]

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
            <h1 className="text-xl font-bold text-gray-900">정산 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm text-gray-500">대기중 출금</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}건</p>
            <p className="text-xs text-gray-500 mt-1">{stats.pendingAmount.toLocaleString()}원 예정</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-gray-500">승인됨</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.approved}건</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">완료된 출금</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}건</p>
            <p className="text-xs text-gray-500 mt-1">총 {stats.totalAmount.toLocaleString()}원</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500">전체 요청</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}건</p>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="예금주명 또는 계좌번호 검색..."
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
                 tab.id === 'approved' ? stats.approved : stats.completed}
              </span>
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">
            <div className="col-span-1">요청일</div>
            <div className="col-span-2">예금주</div>
            <div className="col-span-2">은행/계좌</div>
            <div className="col-span-1 text-right">출금액</div>
            <div className="col-span-1 text-right">수수료</div>
            <div className="col-span-1 text-right">실지급액</div>
            <div className="col-span-1">예정일</div>
            <div className="col-span-1">상태</div>
            <div className="col-span-2 text-right">작업</div>
          </div>

          {/* 목록 */}
          {filteredWithdrawals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">출금 요청이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-1 text-xs text-gray-500">
                    {format(new Date(withdrawal.created_at), 'MM/dd HH:mm', { locale: ko })}
                  </div>
                  <div className="col-span-2 font-medium text-gray-900">{withdrawal.bank_holder}</div>
                  <div className="col-span-2 text-sm">
                    <div className="text-gray-900">{withdrawal.bank_name}</div>
                    <div className="text-gray-500">{withdrawal.bank_account}</div>
                  </div>
                  <div className="col-span-1 text-right text-sm text-gray-900">
                    {withdrawal.amount.toLocaleString()}원
                  </div>
                  <div className="col-span-1 text-right text-sm text-gray-500">
                    -{withdrawal.fee.toLocaleString()}원
                  </div>
                  <div className="col-span-1 text-right text-sm font-medium text-gray-900">
                    {withdrawal.net_amount.toLocaleString()}원
                  </div>
                  <div className="col-span-1 text-xs text-gray-500">
                    {format(new Date(withdrawal.scheduled_date), 'MM/dd', { locale: ko })}
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      withdrawal.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      withdrawal.status === 'approved' ? 'bg-blue-50 text-blue-600' :
                      withdrawal.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {withdrawal.status === 'pending' && '대기중'}
                      {withdrawal.status === 'approved' && '승인됨'}
                      {withdrawal.status === 'completed' && '완료'}
                      {withdrawal.status === 'rejected' && '거절'}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    {withdrawal.status === 'pending' && (
                      <>
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
                      </>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 확인 다이얼로그 */}
      {showConfirmDialog && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {confirmAction === 'approve' && '출금 승인'}
                {confirmAction === 'reject' && '출금 거절'}
                {confirmAction === 'complete' && '출금 완료 처리'}
              </h2>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">예금주</span>
                  <span className="font-medium text-gray-900">{selectedWithdrawal.bank_holder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">계좌</span>
                  <span>{selectedWithdrawal.bank_name} {selectedWithdrawal.bank_account}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">실지급액</span>
                  <span className="font-bold text-lg text-gray-900">{selectedWithdrawal.net_amount.toLocaleString()}원</span>
                </div>
              </div>
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
                className={`flex-1 ${confirmAction === 'reject' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}
                onClick={processAction}
                disabled={isProcessing}
              >
                {isProcessing ? '처리 중...' : '확인'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
