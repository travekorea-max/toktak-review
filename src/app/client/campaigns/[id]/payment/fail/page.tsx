'use client'

import { use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
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

  const errorCode = searchParams.get('code') || 'UNKNOWN_ERROR'
  const errorMessage = searchParams.get('message') || '결제가 실패했습니다'
  const orderId = searchParams.get('orderId')

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
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 실패 헤더 */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">결제에 실패했습니다</h1>
          <p className="text-sm text-gray-500 mt-2">
            {getErrorDescription(errorCode)}
          </p>
        </div>

        {/* 에러 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">오류 정보</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">오류 코드</span>
              <span className="text-sm font-mono text-red-600">{errorCode}</span>
            </div>
            {orderId && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">주문번호</span>
                <span className="text-sm font-mono text-gray-900">{orderId}</span>
              </div>
            )}
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="space-y-2 text-sm text-gray-600">
            <p>일시적인 오류일 수 있으니 잠시 후 다시 시도해주세요.</p>
            <p>문제가 계속되면 다른 결제 수단을 이용해주세요.</p>
            <p>추가 문의는 고객센터로 연락해주세요.</p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/client/campaigns')}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            캠페인 목록
          </Button>
          <Button
            onClick={() => router.push(`/client/campaigns/${id}/payment`)}
            className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  )
}
