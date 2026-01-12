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
  User,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, reviewerProfile, setReviewerProfile } = useAuthStore()

  const [name, setName] = useState(reviewerProfile?.name || '')
  const [phone, setPhone] = useState(reviewerProfile?.phone || '')
  const [addressZipcode, setAddressZipcode] = useState(reviewerProfile?.address_zipcode || '')
  const [addressMain, setAddressMain] = useState(reviewerProfile?.address_main || '')
  const [addressDetail, setAddressDetail] = useState(reviewerProfile?.address_detail || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !phone.trim()) {
      setError('이름과 전화번호는 필수 입력 항목입니다')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(false)

      const { data, error: updateError } = await supabase
        .from('reviewer_profiles')
        .update({
          name,
          phone,
          address_zipcode: addressZipcode || null,
          address_main: addressMain || null,
          address_detail: addressDetail || null,
        })
        .eq('user_id', user?.id)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) setReviewerProfile(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error:', err)
      setError('프로필 저장 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBasicInfoComplete = name && phone
  const isAddressComplete = addressZipcode && addressMain

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
          <h1 className="text-xl font-bold text-gray-900">프로필 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            기본 정보와 배송지 정보를 수정하세요
          </p>
        </div>

        {/* 상태 배너 */}
        <div className={`rounded-xl p-4 mb-6 ${
          isBasicInfoComplete
            ? 'bg-emerald-50 border border-emerald-100'
            : 'bg-amber-50 border border-amber-100'
        }`}>
          <div className="flex items-center gap-3">
            {isBasicInfoComplete ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-emerald-700">
                  기본 정보가 등록되어 있습니다
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <p className="text-sm text-amber-700">
                  이름과 전화번호를 입력해주세요
                </p>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">기본 정보</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명을 입력하세요"
                  className="h-11 bg-white border-gray-200"
                  required
                />
                <p className="text-xs text-gray-500">
                  쇼핑몰 구매 시 사용하는 이름과 동일해야 합니다
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  전화번호 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ''))}
                    placeholder="010-0000-0000"
                    className="h-11 pl-10 bg-white border-gray-200"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 배송지 정보 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">배송지 정보</h2>
              </div>
              {isAddressComplete && (
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  등록완료
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              제품 수령을 위한 주소를 입력하세요 (선택)
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode" className="text-sm font-medium text-gray-700">
                  우편번호
                </Label>
                <Input
                  id="zipcode"
                  value={addressZipcode}
                  onChange={(e) => setAddressZipcode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="12345"
                  className="h-11 bg-white border-gray-200"
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressMain" className="text-sm font-medium text-gray-700">
                  주소
                </Label>
                <Input
                  id="addressMain"
                  value={addressMain}
                  onChange={(e) => setAddressMain(e.target.value)}
                  placeholder="도로명 또는 지번 주소"
                  className="h-11 bg-white border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressDetail" className="text-sm font-medium text-gray-700">
                  상세주소
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="addressDetail"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="아파트, 동/호수 등"
                    className="h-11 pl-10 bg-white border-gray-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 계좌 정보 안내 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex gap-3">
              <Building className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">계좌 정보</p>
                <p className="text-sm text-gray-500">
                  계좌 정보는{' '}
                  <Link href="/reviewer/mypage/account" className="text-[#4F46E5] hover:underline">
                    계좌 정보 페이지
                  </Link>
                  에서 별도로 관리할 수 있습니다.
                </p>
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
              <p className="text-sm text-emerald-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                프로필이 저장되었습니다
              </p>
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
