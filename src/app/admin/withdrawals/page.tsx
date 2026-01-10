'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  User,
  Calendar,
  Building,
  Loader2
} from 'lucide-react'

interface Withdrawal {
  id: string
  reviewer_id: string
  amount: number
  bank_name: string
  bank_account: string
  bank_holder: string
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  created_at: string
  processed_at: string | null
  reject_reason: string | null
  reviewer_profiles?: {
    name: string
  }
}

const tabs = [
  { id: 'pending', label: '대기중' },
  { id: 'completed', label: '완료' },
  { id: 'rejected', label: '반려' },
  { id: 'all', label: '전체' },
]

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchWithdrawals()
  }, [activeTab])

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/withdrawals?status=${activeTab}`)
      const data = await response.json()
      setWithdrawals(data.withdrawals || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (withdrawal: Withdrawal) => {
    if (!confirm(`${withdrawal.reviewer_profiles?.name}님에게 ${withdrawal.amount.toLocaleString()}원을 출금 처리하시겠습니까?`)) {
      return
    }

    try {
      setProcessingId(withdrawal.id)
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: withdrawal.id,
          action: 'approve',
        }),
      })

      if (response.ok) {
        alert('출금이 승인되었습니다')
        fetchWithdrawals()
      } else {
        const data = await response.json()
        alert(data.error || '처리 중 오류가 발생했습니다')
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      alert('처리 중 오류가 발생했습니다')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      alert('반려 사유를 입력해주세요')
      return
    }

    try {
      setProcessingId(selectedWithdrawal.id)
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal.id,
          action: 'reject',
          rejectReason,
        }),
      })

      if (response.ok) {
        alert('출금이 반려되었습니다')
        setShowRejectDialog(false)
        setRejectReason('')
        setSelectedWithdrawal(null)
        fetchWithdrawals()
      } else {
        const data = await response.json()
        alert(data.error || '처리 중 오류가 발생했습니다')
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
      alert('처리 중 오류가 발생했습니다')
    } finally {
      setProcessingId(null)
    }
  }

  const counts = {
    pending: withdrawals.filter(w => w.status === 'pending').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    all: withdrawals.length,
  }

  const totalPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">출금 관리</h1>
        <p className="text-sm text-gray-500 mt-1">리뷰어 출금 신청을 처리하세요</p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-sm text-gray-500">대기중</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{counts.pending}건</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#4F46E5]" />
            </div>
            <span className="text-sm text-gray-500">대기 금액</span>
          </div>
          <p className="text-2xl font-bold text-[#4F46E5]">{totalPending.toLocaleString()}원</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm text-gray-500">완료</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{counts.completed}건</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-gray-500">반려</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{counts.rejected}건</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        {tabs.map(tab => (
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
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-100">
        {withdrawals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">출금 신청이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {withdrawals.map(withdrawal => (
              <div key={withdrawal.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        withdrawal.status === 'pending'
                          ? 'bg-amber-50 text-amber-600'
                          : withdrawal.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {withdrawal.status === 'pending' ? '대기중' :
                         withdrawal.status === 'completed' ? '완료' : '반려'}
                      </span>
                    </div>

                    <p className="text-xl font-bold text-gray-900 mb-2">
                      {withdrawal.amount.toLocaleString()}원
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {withdrawal.reviewer_profiles?.name || '이름 없음'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {withdrawal.bank_name} {withdrawal.bank_account}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(withdrawal.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>

                    {withdrawal.reject_reason && (
                      <p className="mt-2 text-sm text-red-600">
                        반려 사유: {withdrawal.reject_reason}
                      </p>
                    )}
                  </div>

                  {withdrawal.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => handleApprove(withdrawal)}
                        disabled={processingId === withdrawal.id}
                      >
                        {processingId === withdrawal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            승인
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal)
                          setShowRejectDialog(true)
                        }}
                        disabled={processingId === withdrawal.id}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        반려
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 반려 사유 입력 모달 */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">출금 반려</h2>
              <p className="text-sm text-gray-500 mt-1">반려 사유를 입력해주세요</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="반려 사유를 입력하세요"
                className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectReason('')
                  setSelectedWithdrawal(null)
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleReject}
                disabled={processingId !== null || !rejectReason.trim()}
              >
                {processingId ? '처리 중...' : '반려'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
