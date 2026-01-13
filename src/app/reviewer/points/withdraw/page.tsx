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
  CheckCircle2,
  Sparkles,
  CreditCard
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

  const fee = Math.floor(Number(amount) * 0.033)
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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-[#FAFBFC] to-white">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/reviewer/points" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#4F46E5] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          포인트
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#4F46E5]/10 to-[#7C3AED]/10 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-xs font-medium text-[#4F46E5]">Withdraw</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">출금 신청</h1>
          <p className="text-sm text-gray-500 mt-1">
            보유 포인트를 계좌로 출금하세요
          </p>
        </div>

        {/* 안내사항 */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-5 mb-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50 flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                최소 출금 금액: 10,000원
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                출금 수수료: 3.3% (원천징수)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                입금일: 신청일로부터 7영업일 이내
              </li>
            </ul>
          </div>
        </div>

        {/* 보유 포인트 */}
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl p-6 mb-6 text-white shadow-xl shadow-[#4F46E5]/25 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-white/80 text-sm">보유 포인트</span>
              <p className="text-3xl font-bold">
                {(reviewerProfile?.point_balance || 0).toLocaleString()}P
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 출금 금액 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-gray-900">출금 금액</h2>
            </div>

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
                  className="h-12 bg-white border-gray-200 rounded-xl focus:border-[#4F46E5] focus:ring-[#4F46E5]"
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      amount === amt.toString()
                        ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-lg shadow-[#4F46E5]/25'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {(amt / 10000).toFixed(0)}만원
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount((reviewerProfile?.point_balance || 0).toString())}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    amount === (reviewerProfile?.point_balance || 0).toString()
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-lg shadow-[#4F46E5]/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전액
                </button>
              </div>

              {amount && Number(amount) >= 10000 && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-5 space-y-3 mt-4 border border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">출금 금액</span>
                    <span className="font-semibold text-gray-900">{Number(amount).toLocaleString()}P</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">수수료 (3.3%)</span>
                    <span className="font-semibold text-red-500">-{fee.toLocaleString()}P</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-900">실수령액</span>
                    <span className="font-bold text-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">{netAmount.toLocaleString()}원</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 계좌 정보 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-gray-900">계좌 정보</h2>
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
                  className="h-12 bg-white border-gray-200 rounded-xl"
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
                  className="h-12 bg-white border-gray-200 rounded-xl"
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
                  className="h-12 bg-white border-gray-200 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-xl border-gray-200"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || Number(amount) < 10000}
              className="flex-1 h-12 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] rounded-xl shadow-lg shadow-[#4F46E5]/25"
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
