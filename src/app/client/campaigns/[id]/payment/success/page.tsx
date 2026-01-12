'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Home,
  ArrowRight,
  AlertCircle,
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
      <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-3 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg text-gray-900">결제를 확인하고 있습니다...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
          <div className="flex gap-3">
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
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 성공 헤더 */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">결제가 완료되었습니다!</h1>
          <p className="text-sm text-gray-500 mt-2">
            캠페인이 곧 활성화됩니다
          </p>
        </div>

        {/* 결제 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">결제 정보</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">주문번호</span>
              <span className="text-sm font-mono text-gray-900">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">결제 금액</span>
              <span className="text-lg font-bold text-[#4F46E5]">
                {Number(amount).toLocaleString()}원
              </span>
            </div>
            {paymentInfo?.payment?.method && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">결제 수단</span>
                <span className="text-sm text-gray-900">{paymentInfo.payment.method}</span>
              </div>
            )}
            {paymentInfo?.payment?.approvedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">결제 일시</span>
                <span className="text-sm text-gray-900">
                  {new Date(paymentInfo.payment.approvedAt).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-[#EEF2FF] rounded-xl p-5">
          <div className="space-y-2 text-sm text-[#4F46E5]">
            <p>결제가 완료되어 캠페인이 자동으로 활성화됩니다.</p>
            <p>세금계산서는 익월 초에 등록하신 이메일로 발송됩니다.</p>
            <p>문의사항은 고객센터로 연락해주세요.</p>
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
            onClick={() => router.push(`/client/campaigns/${id}`)}
            className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA]"
          >
            캠페인 상세보기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
