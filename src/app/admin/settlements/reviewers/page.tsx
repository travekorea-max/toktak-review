'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Search,
  DollarSign,
  TrendingUp,
  Wallet,
  Users,
} from 'lucide-react'
import { Database } from '@/types/database'

type ReviewerProfile = Database['public']['Tables']['reviewer_profiles']['Row']

interface ReviewerSettlement extends ReviewerProfile {
  total_earned: number
  total_withdrawn: number
  pending_withdrawal: number
}

export default function ReviewerSettlementsPage() {
  const supabase = createClient()
  const [reviewers, setReviewers] = useState<ReviewerSettlement[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'balance' | 'earned' | 'name'>('balance')

  useEffect(() => {
    fetchReviewers()
  }, [])

  const fetchReviewers = async () => {
    try {
      setIsLoading(true)

      // 리뷰어 프로필 가져오기
      const { data: profiles, error: profileError } = await supabase
        .from('reviewer_profiles')
        .select('*')
        .order('point_balance', { ascending: false })

      if (profileError) throw profileError

      // 각 리뷰어의 정산 정보 계산
      const reviewersWithSettlements = await Promise.all(
        (profiles || []).map(async (profile) => {
          // 포인트 적립 내역 (총 적립)
          const { data: earnedData } = await supabase
            .from('point_transactions')
            .select('amount')
            .eq('reviewer_id', profile.user_id)
            .eq('type', 'earn')

          // 출금 완료된 금액
          const { data: withdrawnData } = await supabase
            .from('withdrawal_requests')
            .select('net_amount')
            .eq('reviewer_id', profile.user_id)
            .eq('status', 'completed')

          // 대기중인 출금
          const { data: pendingData } = await supabase
            .from('withdrawal_requests')
            .select('net_amount')
            .eq('reviewer_id', profile.user_id)
            .in('status', ['pending', 'approved'])

          const total_earned = earnedData?.reduce((sum, t) => sum + t.amount, 0) || 0
          const total_withdrawn = withdrawnData?.reduce((sum, w) => sum + w.net_amount, 0) || 0
          const pending_withdrawal = pendingData?.reduce((sum, w) => sum + w.net_amount, 0) || 0

          return {
            ...profile,
            total_earned,
            total_withdrawn,
            pending_withdrawal,
          }
        })
      )

      setReviewers(reviewersWithSettlements)
    } catch (err) {
      console.error('Error fetching reviewers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredReviewers = () => {
    let filtered = reviewers

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery)
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'balance') return b.point_balance - a.point_balance
      if (sortBy === 'earned') return b.total_earned - a.total_earned
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

    return filtered
  }

  const filteredReviewers = getFilteredReviewers()

  const stats = {
    totalReviewers: reviewers.length,
    totalBalance: reviewers.reduce((sum, r) => sum + r.point_balance, 0),
    totalEarned: reviewers.reduce((sum, r) => sum + r.total_earned, 0),
    totalWithdrawn: reviewers.reduce((sum, r) => sum + r.total_withdrawn, 0),
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
        {/* 뒤로가기 */}
        <Link
          href="/admin/settlements"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          정산 관리로 돌아가기
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">리뷰어별 정산 현황</h1>
          <p className="text-sm text-gray-500 mt-1">
            각 리뷰어의 포인트 현황을 확인하세요
          </p>
        </div>

        {/* 전체 통계 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">전체 리뷰어</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReviewers}명</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-gray-500">총 보유 포인트</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalBalance.toLocaleString()}P</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">총 적립 포인트</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalEarned.toLocaleString()}P</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500">총 출금 완료</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalWithdrawn.toLocaleString()}원</p>
          </div>
        </div>

        {/* 검색 & 정렬 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="이름 또는 연락처로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('balance')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'balance'
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              보유순
            </button>
            <button
              onClick={() => setSortBy('earned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'earned'
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              적립순
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'name'
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              이름순
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-8 gap-4 px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">
            <div>리뷰어</div>
            <div>연락처</div>
            <div className="text-center">리뷰 수</div>
            <div className="text-right">총 적립</div>
            <div className="text-right">총 출금</div>
            <div className="text-right">대기중 출금</div>
            <div className="text-right">현재 잔액</div>
            <div>계좌 정보</div>
          </div>

          {/* 목록 */}
          {filteredReviewers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">리뷰어가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredReviewers.map((reviewer) => (
                <div key={reviewer.id} className="grid grid-cols-8 gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{reviewer.name}</p>
                    <p className="text-xs text-gray-500">평점 {reviewer.rating.toFixed(1)}</p>
                  </div>
                  <div className="text-sm text-gray-600">{reviewer.phone}</div>
                  <div className="text-center">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      {reviewer.review_count}건
                    </span>
                  </div>
                  <div className="text-right text-sm text-emerald-600">
                    +{reviewer.total_earned.toLocaleString()}P
                  </div>
                  <div className="text-right text-sm text-gray-900">
                    {reviewer.total_withdrawn.toLocaleString()}원
                  </div>
                  <div className="text-right text-sm">
                    {reviewer.pending_withdrawal > 0 ? (
                      <span className="text-amber-600">
                        {reviewer.pending_withdrawal.toLocaleString()}원
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="text-right text-sm font-bold text-blue-600">
                    {reviewer.point_balance.toLocaleString()}P
                  </div>
                  <div className="text-sm">
                    {reviewer.bank_name && reviewer.bank_account ? (
                      <div>
                        <p className="text-gray-900">{reviewer.bank_name}</p>
                        <p className="text-gray-500">{reviewer.bank_account}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">미등록</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 총 인원 */}
        {filteredReviewers.length > 0 && (
          <div className="text-center text-sm text-gray-500 mt-6">
            총 {filteredReviewers.length}명의 리뷰어
          </div>
        )}
      </div>
    </div>
  )
}
