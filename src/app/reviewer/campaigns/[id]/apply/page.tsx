'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Wallet,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

export default function CampaignApplyPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = searchParams.get('platform') as 'naver' | 'coupang'
  const supabase = createClient()
  const { user, reviewerProfile } = useAuthStore()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [message, setMessage] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCampaign()
    }
  }, [id])

  const fetchCampaign = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setCampaign(data)
    } catch (err) {
      console.error('Error fetching campaign:', err)
      setError('캠페인을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreeTerms) {
      setError('주의사항에 동의해주세요')
      return
    }

    if (!user || !reviewerProfile) {
      setError('로그인이 필요합니다')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // 중복 신청 확인
      const { data: existing } = await supabase
        .from('applications')
        .select('*')
        .eq('campaign_id', id)
        .eq('reviewer_id', user.id)
        .eq('platform', platform)
        .single()

      if (existing) {
        setError('이미 신청한 캠페인입니다')
        return
      }

      // 신청 등록
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          campaign_id: id as string,
          reviewer_id: user.id,
          platform: platform,
          message: message || null,
          status: 'applied',
        })

      if (insertError) throw insertError

      alert('캠페인 신청이 완료되었습니다')
      router.push(`/reviewer/campaigns/${id}`)
    } catch (err) {
      console.error('Error applying:', err)
      setError('신청 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-lg mx-auto px-6 py-8">
          <Skeleton className="h-5 w-24 mb-6" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <Skeleton className="h-32 rounded-xl mb-6" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-700 mb-1">오류가 발생했습니다</h2>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} className="bg-red-600 hover:bg-red-700">
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-700 mb-1">캠페인을 찾을 수 없습니다</h2>
            <Link href="/reviewer/campaigns">
              <Button className="mt-4 bg-red-600 hover:bg-red-700">캠페인 목록으로</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!platform || !['naver', 'coupang'].includes(platform)) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-700 mb-1">잘못된 접근입니다</h2>
            <p className="text-sm text-red-600 mb-4">플랫폼 정보가 올바르지 않습니다.</p>
            <Link href={`/reviewer/campaigns/${id}`}>
              <Button className="bg-red-600 hover:bg-red-700">캠페인으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const reviewFee = platform === 'naver' ? campaign.review_fee_naver : campaign.review_fee_coupang
  const productPayback = platform === 'naver'
    ? (campaign.product_payback_naver || campaign.product_price)
    : (campaign.product_payback_coupang || campaign.product_price)
  const additionalPoint = platform === 'naver'
    ? (campaign.additional_point_naver || 0)
    : (campaign.additional_point_coupang || 0)
  const totalPoint = productPayback + additionalPoint

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href={`/reviewer/campaigns/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          캠페인 상세
        </Link>

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              platform === 'naver'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}>
              {platform === 'naver' ? '네이버' : '쿠팡'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">캠페인 신청</h1>
          <p className="text-sm text-gray-500 mt-1">{campaign.title}</p>
        </div>

        {/* 중요 공지 */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">필수 확인사항</p>
              <p className="text-sm text-red-600">
                선정 시 톡톡리뷰 가입 성함과 쇼핑몰 구매자 성함이 <span className="font-bold">반드시 일치</span>해야 합니다.
                불일치 시 포인트가 지급되지 않습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 포인트 안내 */}
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl p-5 mb-6 text-white">
          <p className="text-white/80 text-sm mb-3">리뷰 완료 시 지급 포인트</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/90">제품가격 페이백</span>
              <span className="font-semibold">{productPayback.toLocaleString()}P</span>
            </div>
            {additionalPoint > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-white/90">추가 포인트 {campaign.is_empty_box ? '(빈박스)' : ''}</span>
                <span className="font-semibold">+{additionalPoint.toLocaleString()}P</span>
              </div>
            )}
            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">총 지급 포인트</span>
                <span className="text-2xl font-bold">{totalPoint.toLocaleString()}P</span>
              </div>
            </div>
          </div>
        </div>

        {/* 캠페인 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">캠페인 정보</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">제품명</p>
                <p className="font-medium text-gray-900">{campaign.product_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">제품 가격</p>
                <p className="font-medium text-gray-900">{campaign.product_price.toLocaleString()}원</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">당첨자 발표</p>
                <p className="font-medium text-gray-900">{new Date(campaign.announce_date).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">리뷰 작성 마감</p>
                <p className="font-medium text-gray-900">{new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 신청 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 신청 메시지 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">신청 메시지 (선택)</h2>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                업체에게 전달할 메시지
              </Label>
              <Textarea
                id="message"
                placeholder="예) 평소 이 제품에 관심이 많았습니다. 성실하게 리뷰 작성하겠습니다."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="bg-white border-gray-200 resize-none"
              />
              <p className="text-xs text-gray-500">
                신청 메시지를 통해 선정 확률을 높일 수 있습니다
              </p>
            </div>
          </div>

          {/* 주의사항 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">주의사항</h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-5">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                선정되지 않을 수 있습니다
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                선정 시 제품을 구매하고 구매 인증을 해야 합니다
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                리뷰 작성 기한을 반드시 지켜주세요
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                리뷰 가이드를 준수하지 않으면 포인트가 지급되지 않습니다
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                허위 리뷰 작성 시 법적 책임을 질 수 있습니다
              </li>
            </ul>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="agree"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                className="mt-0.5"
              />
              <label
                htmlFor="agree"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                위 주의사항을 모두 확인했으며 동의합니다
              </label>
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
              disabled={!agreeTerms || isSubmitting}
              className="flex-1 h-11 bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  신청 중...
                </>
              ) : (
                '신청하기'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
