'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/billing'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Building2,
  ArrowRight,
  Home,
  AlertCircle,
} from 'lucide-react'

interface PaymentInfo {
  id: string
  campaign_id: string
  total_amount: number
  payment_status: string
  virtual_bank_name: string | null
  virtual_account_number: string | null
  virtual_account_holder: string | null
  campaigns: {
    title: string
    product_name: string
  }
}

export default function BankTransferPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const supabase = createClient()

  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const virtualAccount = {
    bankName: 'KB국민은행',
    accountNumber: '123-456-789012',
    holder: '(주)톡톡리뷰',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  }

  useEffect(() => {
    if (paymentId) {
      fetchPayment()
    }
  }, [paymentId])

  const fetchPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_payments')
        .select(`
          id,
          campaign_id,
          total_amount,
          payment_status,
          virtual_bank_name,
          virtual_account_number,
          virtual_account_holder,
          campaigns (
            title,
            product_name
          )
        `)
        .eq('id', paymentId)
        .single()

      if (error) throw error
      setPayment(data as any)

      await supabase
        .from('campaign_payments')
        .update({
          virtual_bank_name: virtualAccount.bankName,
          virtual_account_number: virtualAccount.accountNumber,
          virtual_account_holder: virtualAccount.holder,
          virtual_account_due_date: virtualAccount.dueDate.toISOString(),
        })
        .eq('id', paymentId)

    } catch (err) {
      console.error('Error fetching payment:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">결제 정보를 찾을 수 없습니다</p>
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">결제 요청이 완료되었습니다</h1>
          <p className="text-sm text-gray-500 mt-2">
            아래 계좌로 입금해주시면 결제가 완료됩니다
          </p>
        </div>

        {/* 입금 정보 */}
        <div className="bg-white rounded-xl border-2 border-[#4F46E5]/30 overflow-hidden">
          <div className="px-5 py-4 bg-[#EEF2FF] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#4F46E5]" />
            <h2 className="font-semibold text-gray-900">입금 계좌 정보</h2>
          </div>
          <div className="p-5 space-y-3">
            {/* 은행명 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">입금은행</p>
                <p className="text-lg font-semibold text-gray-900">{virtualAccount.bankName}</p>
              </div>
            </div>

            {/* 계좌번호 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">계좌번호</p>
                <p className="text-lg font-semibold font-mono text-gray-900">{virtualAccount.accountNumber}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(virtualAccount.accountNumber, 'account')}
                className="h-8"
              >
                {copied === 'account' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* 예금주 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">예금주</p>
                <p className="text-lg font-semibold text-gray-900">{virtualAccount.holder}</p>
              </div>
            </div>

            {/* 입금액 */}
            <div className="flex items-center justify-between p-4 bg-[#EEF2FF] rounded-xl border border-[#4F46E5]/20">
              <div>
                <p className="text-xs text-[#4F46E5]">입금 금액</p>
                <p className="text-2xl font-bold text-[#4F46E5]">
                  {formatNumber(payment.total_amount)}원
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(payment.total_amount.toString(), 'amount')}
                className="h-8"
              >
                {copied === 'amount' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* 입금 기한 */}
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-4 rounded-xl">
              <Clock className="w-4 h-4" />
              <span>
                입금 기한: <strong>{formatDate(virtualAccount.dueDate)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 캠페인 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">결제 캠페인</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">캠페인명</span>
              <span className="text-sm font-medium text-gray-900">{(payment.campaigns as any)?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">제품명</span>
              <span className="text-sm text-gray-900">{(payment.campaigns as any)?.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">결제 상태</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
                입금 대기중
              </span>
            </div>
          </div>
        </div>

        {/* 안내 사항 */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-3">입금 시 유의사항</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex gap-2">
              <span className="text-[#4F46E5]">•</span>
              <span>입금자명은 업체명과 동일해야 합니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#4F46E5]">•</span>
              <span>입금 금액이 다를 경우 자동 처리되지 않습니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#4F46E5]">•</span>
              <span>입금 확인까지 영업일 기준 최대 1일이 소요됩니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#4F46E5]">•</span>
              <span>입금 기한 내 미입금 시 결제 요청이 자동 취소됩니다.</span>
            </li>
          </ul>
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
