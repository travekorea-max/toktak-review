'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  FileText,
  Coins,
  ShoppingBag,
  Calendar,
  ExternalLink,
  ChevronRight,
  Info,
  AlertTriangle
} from 'lucide-react'
import { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row'] & {
  campaigns?: Database['public']['Tables']['campaigns']['Row']
}
type PurchaseVerification = Database['public']['Tables']['purchase_verifications']['Row']
type ReviewSubmission = Database['public']['Tables']['review_submissions']['Row']

export default function MyActivityDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [application, setApplication] = useState<Application | null>(null)
  const [verification, setVerification] = useState<PurchaseVerification | null>(null)
  const [review, setReview] = useState<ReviewSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      const { data: appData } = await supabase
        .from('applications')
        .select(`
          *,
          campaigns (*)
        `)
        .eq('id', id)
        .single()

      setApplication(appData)

      const { data: verData } = await supabase
        .from('purchase_verifications')
        .select('*')
        .eq('application_id', id)
        .single()

      setVerification(verData)

      const { data: reviewData } = await supabase
        .from('review_submissions')
        .select('*')
        .eq('application_id', id)
        .single()

      setReview(reviewData)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; bg: string; text: string; icon: any }> = {
      applied: { label: '검토대기', bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
      selected: { label: '선정', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle },
      rejected: { label: '미선정', bg: 'bg-gray-100', text: 'text-gray-500', icon: AlertCircle },
      cancelled: { label: '취소', bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle },
    }
    return config[status] || config.applied
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Skeleton className="h-5 w-24 mb-6" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-8" />
          <Skeleton className="h-24 rounded-xl mb-6" />
          <Skeleton className="h-64 rounded-xl mb-6" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!application || !application.campaigns) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-700 mb-1">활동 내역을 찾을 수 없습니다</h2>
            <p className="text-sm text-red-600 mb-4">요청하신 활동 정보가 존재하지 않습니다.</p>
            <Link href="/reviewer/my-activities">
              <Button className="bg-red-600 hover:bg-red-700">목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const campaign = application.campaigns
  const isSelected = application.status === 'selected'
  const statusConfig = getStatusConfig(application.status)
  const StatusIcon = statusConfig.icon

  const steps = [
    {
      id: 'selected',
      label: '선정',
      icon: CheckCircle,
      completed: application.status === 'selected',
      active: application.status === 'selected' && !verification
    },
    {
      id: 'purchase',
      label: '구매 인증',
      icon: Package,
      completed: !!verification && verification.status === 'approved',
      active: !!verification && verification.status === 'pending'
    },
    {
      id: 'review',
      label: '리뷰 작성',
      icon: FileText,
      completed: !!review && review.status === 'approved',
      active: !!review && review.status === 'pending'
    },
    {
      id: 'point',
      label: '포인트 지급',
      icon: Coins,
      completed: review?.status === 'approved',
      active: false
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/reviewer/my-activities" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          내 활동
        </Link>

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {application.platform === 'naver' ? '네이버' : '쿠팡'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{campaign.title}</h1>
          <p className="text-gray-500 mt-1">{campaign.product_name}</p>
        </div>

        {/* 중요 공지 - 선정된 경우 */}
        {isSelected && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">필수 확인사항</p>
                <p className="text-sm text-red-600">
                  톡톡리뷰 가입 시 등록한 성함과 쇼핑몰 구매자 성함이 <span className="font-bold">반드시 일치</span>해야 합니다.
                  불일치 시 인증이 거부되며 포인트가 지급되지 않습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 진행 상태 - 선정된 경우만 */}
        {isSelected && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-5">진행 상태</h2>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        step.completed
                          ? 'bg-emerald-500 text-white'
                          : step.active
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`text-xs mt-2 font-medium ${
                        step.completed
                          ? 'text-emerald-600'
                          : step.active
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        step.completed ? 'bg-emerald-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 다음 단계 액션 */}
        {isSelected && (
          <div className="mb-6">
            {!verification && (
              <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#4F46E5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">구매 인증이 필요합니다</h3>
                    <p className="text-sm text-gray-600 mb-3">제품을 구매하고 구매 내역을 인증해주세요.</p>
                    <Link href={`/reviewer/my-activities/${id}/purchase-verify`}>
                      <Button className="bg-[#4F46E5] hover:bg-[#4338CA]">
                        구매 인증하기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {verification && verification.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">구매 인증 검토 중</h3>
                    <p className="text-sm text-gray-600">승인 후 리뷰를 작성할 수 있습니다. 잠시만 기다려주세요.</p>
                  </div>
                </div>
              </div>
            )}

            {verification && verification.status === 'approved' && !review && (
              <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#4F46E5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">리뷰를 작성해주세요</h3>
                    <p className="text-sm text-gray-600 mb-3">구매 인증이 완료되었습니다. 리뷰를 작성하고 포인트를 받으세요.</p>
                    <Link href={`/reviewer/my-activities/${id}/review-submit`}>
                      <Button className="bg-[#4F46E5] hover:bg-[#4338CA]">
                        리뷰 작성하기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {review && review.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">리뷰 검수 중</h3>
                    <p className="text-sm text-gray-600">리뷰가 검수 중입니다. 승인 후 포인트가 지급됩니다.</p>
                  </div>
                </div>
              </div>
            )}

            {review && review.status === 'approved' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-700 mb-1">완료! 포인트가 지급되었습니다</h3>
                    <p className="text-sm text-emerald-600">
                      {(application.platform === 'naver' ? campaign.review_fee_naver : campaign.review_fee_coupang).toLocaleString()}P가 지급되었습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {review && review.status === 'revision_requested' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-700 mb-1">리뷰 수정이 필요합니다</h3>
                    <p className="text-sm text-red-600">{review.revision_comment}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 미선정 안내 */}
        {application.status === 'rejected' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-700 mb-1">선정되지 않았습니다</h3>
                <p className="text-sm text-gray-600 mb-3">다른 캠페인에 도전해보세요!</p>
                <Link href="/reviewer/campaigns">
                  <Button variant="outline">다른 캠페인 보기</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 포인트 안내 */}
        {isSelected && (
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl p-5 mb-6 text-white">
            <p className="text-white/80 text-sm mb-3">리뷰 완료 시 지급 포인트</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/90">제품가격 페이백</span>
                <span className="font-semibold">
                  {(application.platform === 'naver'
                    ? (campaign.product_payback_naver || campaign.product_price)
                    : (campaign.product_payback_coupang || campaign.product_price)
                  ).toLocaleString()}P
                </span>
              </div>
              {((application.platform === 'naver' && campaign.additional_point_naver) ||
                (application.platform !== 'naver' && campaign.additional_point_coupang)) && (
                <div className="flex justify-between items-center">
                  <span className="text-white/90">
                    추가 포인트 {campaign.is_empty_box ? '(빈박스)' : ''}
                  </span>
                  <span className="font-semibold">
                    +{(application.platform === 'naver'
                      ? campaign.additional_point_naver
                      : campaign.additional_point_coupang
                    ).toLocaleString()}P
                  </span>
                </div>
              )}
              <div className="border-t border-white/20 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">총 지급 포인트</span>
                  <span className="text-2xl font-bold">
                    {(
                      (application.platform === 'naver'
                        ? (campaign.product_payback_naver || campaign.product_price) + (campaign.additional_point_naver || 0)
                        : (campaign.product_payback_coupang || campaign.product_price) + (campaign.additional_point_coupang || 0)
                      )
                    ).toLocaleString()}P
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 신청 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">신청 정보</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">신청일</span>
              <span className="font-medium text-gray-900">
                {new Date(application.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            {application.selected_at && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">선정일</span>
                <span className="font-medium text-gray-900">
                  {new Date(application.selected_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">제품 가격</span>
              <span className="font-medium text-gray-900">
                {campaign.product_price.toLocaleString()}원
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500 text-sm">리뷰 마감일</span>
              <span className="font-medium text-gray-900">
                {new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>

        {/* 제품 링크 */}
        {isSelected && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">제품 구매</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{campaign.product_name}</p>
                <p className="text-sm text-gray-500">{campaign.product_price.toLocaleString()}원</p>
              </div>
              {application.platform === 'naver' && campaign.product_url_naver && (
                <a
                  href={campaign.product_url_naver}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-[#03C75A] text-white rounded-lg text-sm font-medium hover:bg-[#02b351] transition-colors"
                >
                  네이버에서 구매
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {application.platform === 'coupang' && campaign.product_url_coupang && (
                <a
                  href={campaign.product_url_coupang}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-[#E53935] text-white rounded-lg text-sm font-medium hover:bg-[#d32f2f] transition-colors"
                >
                  쿠팡에서 구매
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
