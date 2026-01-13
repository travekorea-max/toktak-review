'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Sparkles,
  Gift,
  Coins
} from 'lucide-react'
import { Database } from '@/types/database'

type PointTransaction = Database['public']['Tables']['point_transactions']['Row']

export default function PointsPage() {
  const supabase = createClient()
  const { user, reviewerProfile } = useAuthStore()

  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('reviewer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setTransactions(data || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const earnTotal = transactions
    .filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0)

  const withdrawTotal = transactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + t.amount, 0)

  const canWithdraw = (reviewerProfile?.point_balance || 0) >= 10000
  const progressPercent = Math.min(((reviewerProfile?.point_balance || 0) / 10000) * 100, 100)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-[#FAFBFC] to-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-[#FAFBFC] to-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#4F46E5]/10 to-[#7C3AED]/10 rounded-full mb-3">
              <Coins className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span className="text-xs font-medium text-[#4F46E5]">Points</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">포인트</h1>
            <p className="text-sm text-gray-500 mt-1">
              포인트 내역을 확인하고 출금하세요
            </p>
          </div>
          <Link href="/reviewer/points/withdraw">
            <Button
              className={`h-11 px-5 rounded-xl shadow-lg transition-all ${
                canWithdraw
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] shadow-[#4F46E5]/25 hover:shadow-xl hover:shadow-[#4F46E5]/30'
                  : 'bg-gray-300 cursor-not-allowed shadow-none'
              }`}
              disabled={!canWithdraw}
            >
              출금 신청
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* 보유 포인트 */}
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl p-6 text-white shadow-xl shadow-[#4F46E5]/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                {canWithdraw && (
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                    출금 가능
                  </span>
                )}
              </div>
              <p className="text-white/80 text-sm mb-2">보유 포인트</p>
              <p className="text-4xl font-bold">
                {(reviewerProfile?.point_balance || 0).toLocaleString()}
                <span className="text-xl font-normal ml-1">P</span>
              </p>
            </div>
          </div>

          {/* 누적 적립 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg shadow-emerald-100/30 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-2">누적 적립</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              +{earnTotal.toLocaleString()}
              <span className="text-lg font-normal text-gray-400 ml-1">P</span>
            </p>
          </div>

          {/* 누적 출금 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg shadow-blue-100/30 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-2">누적 출금</p>
            <p className="text-3xl font-bold text-blue-600">
              -{withdrawTotal.toLocaleString()}
              <span className="text-lg font-normal text-gray-400 ml-1">P</span>
            </p>
          </div>
        </div>

        {/* 출금 안내 */}
        {!canWithdraw && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200/50">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  최소 출금 금액까지 <span className="font-bold">{(10000 - (reviewerProfile?.point_balance || 0)).toLocaleString()}P</span> 남았어요
                </p>
                <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-amber-600 mt-1">{(reviewerProfile?.point_balance || 0).toLocaleString()} / 10,000P</p>
              </div>
            </div>
          </div>
        )}

        {/* 포인트 내역 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-gray-500" />
              </div>
              <h2 className="font-bold text-gray-900">포인트 내역</h2>
            </div>
            <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">최근 50건</span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Wallet className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">포인트 내역이 없습니다</h3>
              <p className="text-gray-500 mb-6">
                캠페인에 참여하고 포인트를 적립하세요
              </p>
              <Link href="/reviewer/campaigns">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] rounded-xl shadow-lg shadow-[#4F46E5]/25">
                  <Sparkles className="w-4 h-4 mr-2" />
                  캠페인 둘러보기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-5 hover:bg-[#4F46E5]/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${
                      transaction.type === 'earn'
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-200/50'
                        : transaction.type === 'withdraw'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-200/50'
                        : 'bg-gradient-to-br from-gray-300 to-gray-400'
                    }`}>
                      {transaction.type === 'earn' ? (
                        <ArrowDownRight className="w-5 h-5 text-white" />
                      ) : transaction.type === 'withdraw' ? (
                        <ArrowUpRight className="w-5 h-5 text-white" />
                      ) : (
                        <Receipt className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.type === 'earn' ? '적립' :
                         transaction.type === 'withdraw' ? '출금' : '취소'}
                      </p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {transaction.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'earn'
                        ? 'text-emerald-600'
                        : transaction.type === 'withdraw'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}
                      {transaction.amount.toLocaleString()}P
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
