'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  Loader2,
  Home,
  ArrowRight,
} from 'lucide-react'

export default function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  // URL 파라미터에서 결제 정보 추출
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  useEffect(() => {
    if (paymentKey && orderId && amount) {
      confirmPayment()
    } else {
      setError('결제 정보가 올바르지 않습니다')
      setLoading(false)
    }
  }, [paymentKey, orderId, amount])

  const confirmPayment = async () => {
    try {
      // 서버에서 결제 승인 처리
      const response = await fetch('/api/payments/toss/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '결제 승인에 실패했습니다')
      }

      setPaymentInfo(result)

    } catch (err: any) {
      console.error('Payment confirm error:', err)
      setError(err.message || '결제 처리 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-lg">결제를 확인하고 있습니다...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/client/campaigns')}
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-2" />
            캠페인 목록
          </Button>
          <Button
            onClick={() => router.push(`/client/campaigns/${id}/payment`)}
            className="flex-1"
          >
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 성공 헤더 */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">결제가 완료되었습니다!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          캠페인이 곧 활성화됩니다
        </p>
      </div>

      {/* 결제 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">주문번호</span>
            <span className="font-mono text-sm">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">결제 금액</span>
            <span className="font-bold text-lg text-blue-600">
              {Number(amount).toLocaleString()}원
            </span>
          </div>
          {paymentInfo?.payment?.method && (
            <div className="flex justify-between">
              <span className="text-gray-600">결제 수단</span>
              <span>{paymentInfo.payment.method}</span>
            </div>
          )}
          {paymentInfo?.payment?.approvedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">결제 일시</span>
              <span>
                {new Date(paymentInfo.payment.approvedAt).toLocaleString('ko-KR')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p>• 결제가 완료되어 캠페인이 자동으로 활성화됩니다.</p>
            <p>• 세금계산서는 익월 초에 등록하신 이메일로 발송됩니다.</p>
            <p>• 문의사항은 고객센터로 연락해주세요.</p>
          </div>
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/client/campaigns')}
          className="flex-1"
        >
          <Home className="h-4 w-4 mr-2" />
          캠페인 목록
        </Button>
        <Button
          onClick={() => router.push(`/client/campaigns/${id}`)}
          className="flex-1"
        >
          캠페인 상세보기
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
