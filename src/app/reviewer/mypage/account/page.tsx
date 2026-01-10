'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

const bankList = [
  '신한은행',
  '국민은행',
  'NH농협은행',
  '우리은행',
  '하나은행',
  '기업은행',
  '카카오뱅크',
  '토스뱅크',
  '케이뱅크',
  'SC제일은행',
  '씨티은행',
  '수협은행',
  '대구은행',
  '부산은행',
  '광주은행',
  '전북은행',
  '경남은행',
  '제주은행',
  '새마을금고',
  '신협',
  '우체국',
]

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, reviewerProfile, setReviewerProfile } = useAuthStore()

  const [bankName, setBankName] = useState(reviewerProfile?.bank_name || '')
  const [bankAccount, setBankAccount] = useState(reviewerProfile?.bank_account || '')
  const [bankHolder, setBankHolder] = useState(reviewerProfile?.bank_holder || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bankName || !bankAccount || !bankHolder) {
      setError('모든 항목을 입력해주세요')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(false)

      const { data, error: updateError } = await supabase
        .from('reviewer_profiles')
        .update({
          bank_name: bankName,
          bank_account: bankAccount,
          bank_holder: bankHolder,
        })
        .eq('user_id', user?.id)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) setReviewerProfile(data)
      setSuccess(true)
    } catch (err) {
      console.error('Error:', err)
      setError('계좌 정보 저장 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isComplete = bankName && bankAccount && bankHolder

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/reviewer/mypage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          마이페이지
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">계좌 정보</h1>
          <p className="text-sm text-gray-500 mt-1">
            포인트 출금을 위한 계좌 정보를 관리하세요
          </p>
        </div>

        {/* 상태 배너 */}
        <div className={`rounded-xl p-4 mb-6 ${
          isComplete
            ? 'bg-emerald-50 border border-emerald-100'
            : 'bg-amber-50 border border-amber-100'
        }`}>
          <div className="flex items-center gap-3">
            {isComplete ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-emerald-700">
                  계좌 정보가 등록되어 있습니다
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <p className="text-sm text-amber-700">
                  포인트 출금을 위해 계좌 정보를 등록해주세요
                </p>
              </>
            )}
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">출금 계좌</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  은행 <span className="text-red-500">*</span>
                </Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger className="h-11 bg-white border-gray-200">
                    <SelectValue placeholder="은행을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankList.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount" className="text-sm font-medium text-gray-700">
                  계좌번호 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankAccount"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="'-' 없이 숫자만 입력"
                  className="h-11 bg-white border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankHolder" className="text-sm font-medium text-gray-700">
                  예금주 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankHolder"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="예금주명을 입력하세요"
                  className="h-11 bg-white border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* 안내사항 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex gap-3">
              <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 space-y-1">
                <p>본인 명의 계좌만 등록 가능합니다.</p>
                <p>계좌 정보 변경 시 다음 출금부터 적용됩니다.</p>
                <p>잘못된 계좌 정보로 인한 출금 오류는 책임지지 않습니다.</p>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-sm text-emerald-600">계좌 정보가 저장되었습니다</p>
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
              disabled={isSubmitting}
              className="flex-1 h-11 bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장하기'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
