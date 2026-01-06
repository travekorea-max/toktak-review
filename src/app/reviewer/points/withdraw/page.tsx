'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

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
      alert('최소 출금 금액은 10,000원입니다')
      return
    }

    if (!reviewerProfile || amountNum > reviewerProfile.point_balance) {
      alert('보유 포인트가 부족합니다')
      return
    }

    if (!bankName || !bankAccount || !bankHolder) {
      alert('계좌 정보를 모두 입력해주세요')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // 출금 요청 등록
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 7) // 7일 후

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

      // 포인트 차감
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

      // 프로필 잔액 업데이트
      const { error: updateError } = await supabase
        .from('reviewer_profiles')
        .update({
          point_balance: reviewerProfile.point_balance - amountNum,
        })
        .eq('user_id', user?.id)

      if (updateError) throw updateError

      alert(`출금 신청이 완료되었습니다.\n입금 예정일: ${scheduledDate.toLocaleDateString('ko-KR')}`)
      router.push('/points')
    } catch (err) {
      console.error('Error:', err)
      setError('출금 신청 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickAmounts = [10000, 30000, 50000, 100000]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">출금 신청</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          보유 포인트를 출금하세요
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>최소 출금 금액: 10,000원</li>
            <li>출금 수수료: 3.3% (원천징수)</li>
            <li>입금일: 신청일로부터 7영업일 이내</li>
            <li>계좌정보는 정확하게 입력해주세요</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>보유 포인트</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {reviewerProfile?.point_balance.toLocaleString() || 0}
            <span className="text-lg text-gray-500 ml-2">원</span>
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>출금 금액</CardTitle>
            <CardDescription>출금할 금액을 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">출금 금액 *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10000"
                step="1000"
                required
              />
            </div>

            <div className="flex gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt.toString())}
                  disabled={!reviewerProfile || amt > reviewerProfile.point_balance}
                >
                  {(amt / 10000).toFixed(0)}만원
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((reviewerProfile?.point_balance || 0).toString())}
              >
                전액
              </Button>
            </div>

            {amount && Number(amount) >= 10000 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>출금 금액</span>
                  <span className="font-medium">{Number(amount).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>수수료 (3.3%)</span>
                  <span className="font-medium text-red-600">-{fee.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>실수령액</span>
                  <span className="text-green-600">{netAmount.toLocaleString()}원</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>계좌 정보</CardTitle>
            <CardDescription>입금받을 계좌 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bankName">은행명 *</Label>
              <Input
                id="bankName"
                placeholder="예) 국민은행"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="bankAccount">계좌번호 *</Label>
              <Input
                id="bankAccount"
                placeholder="- 없이 입력"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="bankHolder">예금주 *</Label>
              <Input
                id="bankHolder"
                placeholder="예금주명"
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !amount || Number(amount) < 10000}
            className="flex-1"
          >
            {isSubmitting ? '신청 중...' : '출금 신청'}
          </Button>
        </div>
      </form>
    </div>
  )
}
