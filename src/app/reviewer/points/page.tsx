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
  ChevronRight
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">포인트</h1>
            <p className="text-sm text-gray-500 mt-1">
              포인트 내역을 확인하고 출금하세요
            </p>
          </div>
          <Link href="/reviewer/points/withdraw">
            <Button
              className={`h-9 px-4 text-sm ${
                canWithdraw
                  ? 'bg-[#4F46E5] hover:bg-[#4338CA]'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              disabled={!canWithdraw}
            >
              출금 신청
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* 보유 포인트 */}
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              {canWithdraw && (
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                  출금 가능
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm mb-1">보유 포인트</p>
            <p className="text-3xl font-bold">
              {(reviewerProfile?.point_balance || 0).toLocaleString()}
              <span className="text-lg font-normal ml-1">P</span>
            </p>
          </div>

          {/* 누적 적립 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">누적 적립</p>
            <p className="text-2xl font-bold text-emerald-600">
              +{earnTotal.toLocaleString()}
              <span className="text-base font-normal text-gray-400 ml-1">P</span>
            </p>
          </div>

          {/* 누적 출금 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">누적 출금</p>
            <p className="text-2xl font-bold text-blue-600">
              -{withdrawTotal.toLocaleString()}
              <span className="text-base font-normal text-gray-400 ml-1">P</span>
            </p>
          </div>
        </div>

        {/* 출금 안내 */}
        {!canWithdraw && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">
              최소 출금 금액은 <span className="font-semibold">10,000P</span>입니다.
              현재 <span className="font-semibold">{(10000 - (reviewerProfile?.point_balance || 0)).toLocaleString()}P</span> 더 필요합니다.
            </p>
          </div>
        )}

        {/* 포인트 내역 */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">포인트 내역</h2>
            </div>
            <span className="text-sm text-gray-400">최근 50건</span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">포인트 내역이 없습니다</h3>
              <p className="text-sm text-gray-500 mb-4">
                캠페인에 참여하고 포인트를 적립하세요
              </p>
              <Link href="/reviewer/campaigns">
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA]">
                  캠페인 둘러보기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'earn'
                        ? 'bg-emerald-50'
                        : transaction.type === 'withdraw'
                        ? 'bg-blue-50'
                        : 'bg-gray-100'
                    }`}>
                      {transaction.type === 'earn' ? (
                        <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                      ) : transaction.type === 'withdraw' ? (
                        <ArrowUpRight className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Receipt className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.type === 'earn' ? '적립' :
                         transaction.type === 'withdraw' ? '출금' : '취소'}
                      </p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {transaction.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${
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
