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
  AlertCircle,
  Sparkles
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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-[#FAFBFC] to-white">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/reviewer/mypage" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#4F46E5] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          마이페이지
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#4F46E5]/10 to-[#7C3AED]/10 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-xs font-medium text-[#4F46E5]">Profile</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">프로필 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            기본 정보와 배송지 정보를 수정하세요
          </p>
        </div>

        {/* 상태 배너 */}
        <div className={`rounded-2xl p-4 mb-6 ${
          isBasicInfoComplete
            ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200'
            : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {isBasicInfoComplete ? (
              <>
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-emerald-700 font-medium">
                  기본 정보가 등록되어 있습니다
                </p>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-amber-700 font-medium">
                  이름과 전화번호를 입력해주세요
                </p>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#4F46E5]/25">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-gray-900">기본 정보</h2>
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
                  className="h-12 bg-white border-gray-200 rounded-xl focus:border-[#4F46E5] focus:ring-[#4F46E5]"
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
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ''))}
                    placeholder="010-0000-0000"
                    className="h-12 pl-10 bg-white border-gray-200 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 배송지 정보 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-bold text-gray-900">배송지 정보</h2>
              </div>
              {isAddressComplete && (
                <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
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
                  className="h-12 bg-white border-gray-200 rounded-xl"
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
                  className="h-12 bg-white border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressDetail" className="text-sm font-medium text-gray-700">
                  상세주소
                </Label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="addressDetail"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="아파트, 동/호수 등"
                    className="h-12 pl-10 bg-white border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 계좌 정보 안내 */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-5 border border-gray-200">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Building className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">계좌 정보</p>
                <p className="text-sm text-gray-500">
                  계좌 정보는{' '}
                  <Link href="/reviewer/mypage/account" className="text-[#4F46E5] font-medium hover:underline">
                    계좌 정보 페이지
                  </Link>
                  에서 별도로 관리할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-sm text-emerald-600 flex items-center gap-2 font-medium">
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
              className="flex-1 h-12 rounded-xl border-gray-200"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] rounded-xl shadow-lg shadow-[#4F46E5]/25"
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
