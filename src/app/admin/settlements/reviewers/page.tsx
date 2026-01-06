'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, DollarSign, TrendingUp, Wallet } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settlements">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">리뷰어별 정산 현황</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            각 리뷰어의 포인트 현황을 확인하세요
          </p>
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3" />
              전체 리뷰어
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalReviewers}명</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Wallet className="w-3 h-3" />
              총 보유 포인트
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {stats.totalBalance.toLocaleString()}P
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              총 적립 포인트
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.totalEarned.toLocaleString()}P
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              총 출금 완료
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats.totalWithdrawn.toLocaleString()}원
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 검색 & 정렬 */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="이름 또는 연락처로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'balance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('balance')}
          >
            보유순
          </Button>
          <Button
            variant={sortBy === 'earned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('earned')}
          >
            적립순
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            이름순
          </Button>
        </div>
      </div>

      {/* 리뷰어 목록 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>리뷰어</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>리뷰 수</TableHead>
                <TableHead className="text-right">총 적립</TableHead>
                <TableHead className="text-right">총 출금</TableHead>
                <TableHead className="text-right">대기중 출금</TableHead>
                <TableHead className="text-right">현재 잔액</TableHead>
                <TableHead>계좌 정보</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : filteredReviewers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    리뷰어가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviewers.map((reviewer) => (
                  <TableRow key={reviewer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reviewer.name}</div>
                        <div className="text-xs text-gray-500">
                          평점 {reviewer.rating.toFixed(1)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{reviewer.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{reviewer.review_count}건</Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      +{reviewer.total_earned.toLocaleString()}P
                    </TableCell>
                    <TableCell className="text-right">
                      {reviewer.total_withdrawn.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right">
                      {reviewer.pending_withdrawal > 0 ? (
                        <span className="text-yellow-600">
                          {reviewer.pending_withdrawal.toLocaleString()}원
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      {reviewer.point_balance.toLocaleString()}P
                    </TableCell>
                    <TableCell>
                      {reviewer.bank_name && reviewer.bank_account ? (
                        <div className="text-sm">
                          <div>{reviewer.bank_name}</div>
                          <div className="text-gray-500">{reviewer.bank_account}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">미등록</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isLoading && filteredReviewers.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          총 {filteredReviewers.length}명의 리뷰어
        </div>
      )}
    </div>
  )
}
