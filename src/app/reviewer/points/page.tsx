'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Database } from '@/types/database'

type PointTransaction = Database['public']['Tables']['point_transactions']['Row']

export default function PointsPage() {
  const router = useRouter()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">포인트</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            포인트 내역을 확인하고 출금을 신청하세요
          </p>
        </div>
        <Link href="/points/withdraw">
          <Button>
            출금 신청
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              보유 포인트
            </CardDescription>
            <CardTitle className="text-4xl">
              {reviewerProfile?.point_balance.toLocaleString() || 0}
              <span className="text-lg text-gray-500 ml-2">원</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              누적 적립
            </CardDescription>
            <CardTitle className="text-4xl text-green-600">
              {earnTotal.toLocaleString()}
              <span className="text-lg text-gray-500 ml-2">원</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              누적 출금
            </CardDescription>
            <CardTitle className="text-4xl text-blue-600">
              {withdrawTotal.toLocaleString()}
              <span className="text-lg text-gray-500 ml-2">원</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>포인트 내역</CardTitle>
          <CardDescription>최근 50건의 포인트 거래 내역입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>내용</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead className="text-right">잔액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    포인트 내역이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      {transaction.type === 'earn' && (
                        <Badge className="bg-green-500">적립</Badge>
                      )}
                      {transaction.type === 'withdraw' && (
                        <Badge className="bg-blue-500">출금</Badge>
                      )}
                      {transaction.type === 'cancel' && (
                        <Badge variant="outline">취소</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'earn' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}
                      {transaction.amount.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.balance_after.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
