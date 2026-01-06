'use client'

import { use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  XCircle,
  Home,
  RefreshCw,
} from 'lucide-react'

export default function PaymentFailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터에서 에러 정보 추출
  const errorCode = searchParams.get('code') || 'UNKNOWN_ERROR'
  const errorMessage = searchParams.get('message') || '결제가 실패했습니다'
  const orderId = searchParams.get('orderId')

  // 에러 코드별 사용자 친화적 메시지
  const getErrorDescription = (code: string) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다. 다시 시도해주세요.'
      case 'PAY_PROCESS_ABORTED':
        return '결제가 중단되었습니다. 다시 시도해주세요.'
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다. 다른 카드로 시도해주세요.'
      case 'INVALID_CARD_EXPIRATION':
        return '카드 유효기간이 올바르지 않습니다.'
      case 'INVALID_STOPPED_CARD':
        return '정지된 카드입니다.'
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 한도를 초과했습니다.'
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '결제 금액 한도를 초과했습니다.'
      case 'INVALID_BANK':
        return '해당 은행은 가상계좌를 지원하지 않습니다.'
      default:
        return errorMessage
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 실패 헤더 */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full mb-4">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold">결제에 실패했습니다</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {getErrorDescription(errorCode)}
        </p>
      </div>

      {/* 에러 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>오류 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">오류 코드</span>
            <span className="font-mono text-sm text-red-600">{errorCode}</span>
          </div>
          {orderId && (
            <div className="flex justify-between">
              <span className="text-gray-600">주문번호</span>
              <span className="font-mono text-sm">{orderId}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 일시적인 오류일 수 있으니 잠시 후 다시 시도해주세요.</p>
            <p>• 문제가 계속되면 다른 결제 수단을 이용해주세요.</p>
            <p>• 추가 문의는 고객센터로 연락해주세요.</p>
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
          onClick={() => router.push(`/client/campaigns/${id}/payment`)}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      </div>
    </div>
  )
}
