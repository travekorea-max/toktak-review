'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Wallet,
  Building2,
  Info,
  Loader2,
  CheckCircle2
} from 'lucide-react'

export default function WithdrawPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, reviewerProfile } = useAuthStore()

  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState(reviewerProfile?.bank_name || '')
  const [bankAccount, setBankAccount] = useState(reviewerProfile?.bank_account || '')
  const [bankHolder, setBankHolder] = useState(reviewerProfile?.bank_holder || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fee = Math.floor(Number(amount) * 0.033) // 3.3% 수수료
  const netAmount = Number(amount) - fee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = Number(amount)

    if (amountNum < 10000) {
      setError('최소 출금 금액은 10,000원입니다')
      return
    }

    if (!reviewerProfile || amountNum > reviewerProfile.point_balance) {
      setError('보유 포인트가 부족합니다')
      return
    }

    if (!bankName || !bankAccount || !bankHolder) {
      setError('계좌 정보를 모두 입력해주세요')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 7)

      const { error: insertError } = await supabase
        .from('withdrawal_requests')
        .insert({
          reviewer_id: user?.id,
          amount: amountNum,
          fee: fee,
          net_amount: netAmount,
          bank_name: bankName,
          bank_account: bankAccount,
          bank_holder: bankHolder,
          status: 'pending',
          scheduled_date: scheduledDate.toISOString(),
        })

      if (insertError) throw insertError

      const { error: pointError } = await supabase
        .from('point_transactions')
        .insert({
          reviewer_id: user?.id,
          type: 'withdraw',
          amount: amountNum,
          balance_after: reviewerProfile.point_balance - amountNum,
          reference_type: 'withdrawal',
          description: '출금 신청',
        })

      if (pointError) throw pointError

      const { error: updateError } = await supabase
        .from('reviewer_profiles')
        .update({
          point_balance: reviewerProfile.point_balance - amountNum,
        })
        .eq('user_id', user?.id)

      if (updateError) throw updateError

      alert(`출금 신청이 완료되었습니다.\n입금 예정일: ${scheduledDate.toLocaleDateString('ko-KR')}`)
      router.push('/reviewer/points')
    } catch (err) {
      console.error('Error:', err)
      setError('출금 신청 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickAmounts = [10000, 30000, 50000, 100000]

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/reviewer/points" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          포인트
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">출금 신청</h1>
          <p className="text-sm text-gray-500 mt-1">
            보유 포인트를 계좌로 출금하세요
          </p>
        </div>

        {/* 안내사항 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <ul className="text-sm text-blue-700 space-y-1">
              <li>최소 출금 금액: 10,000원</li>
              <li>출금 수수료: 3.3% (원천징수)</li>
              <li>입금일: 신청일로부터 7영업일 이내</li>
            </ul>
          </div>
        </div>

        {/* 보유 포인트 */}
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl p-5 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-white/80 text-sm">보유 포인트</span>
          </div>
          <p className="text-2xl font-bold">
            {(reviewerProfile?.point_balance || 0).toLocaleString()}P
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 출금 금액 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">출금 금액</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  금액 입력
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10000"
                  step="1000"
                  className="h-11 bg-white border-gray-200"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    disabled={!reviewerProfile || amt > reviewerProfile.point_balance}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      amount === amt.toString()
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {(amt / 10000).toFixed(0)}만원
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount((reviewerProfile?.point_balance || 0).toString())}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    amount === (reviewerProfile?.point_balance || 0).toString()
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전액
                </button>
              </div>

              {amount && Number(amount) >= 10000 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">출금 금액</span>
                    <span className="font-medium text-gray-900">{Number(amount).toLocaleString()}P</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">수수료 (3.3%)</span>
                    <span className="font-medium text-red-500">-{fee.toLocaleString()}P</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">실수령액</span>
                    <span className="font-bold text-[#4F46E5]">{netAmount.toLocaleString()}원</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 계좌 정보 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">계좌 정보</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-sm font-medium text-gray-700">
                  은행명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankName"
                  placeholder="예) 국민은행"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-11 bg-white border-gray-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount" className="text-sm font-medium text-gray-700">
                  계좌번호 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankAccount"
                  placeholder="- 없이 입력"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="h-11 bg-white border-gray-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankHolder" className="text-sm font-medium text-gray-700">
                  예금주 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankHolder"
                  placeholder="예금주명"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className="h-11 bg-white border-gray-200"
                  required
                />
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-11"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || Number(amount) < 10000}
              className="flex-1 h-11 bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  신청 중...
                </>
              ) : (
                '출금 신청'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
