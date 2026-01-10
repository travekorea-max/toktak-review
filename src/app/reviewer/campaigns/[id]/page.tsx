'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  MapPin,
  Users,
  Wallet,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Tag,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react'
import { Database } from '@/types/database'
import { ImageGallery } from '@/components/campaigns/ImageGallery'

type Campaign = Database['public']['Tables']['campaigns']['Row']
type Application = Database['public']['Tables']['applications']['Row']

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: '임시저장', bg: 'bg-gray-100', text: 'text-gray-600' },
  pending: { label: '승인대기', bg: 'bg-amber-50', text: 'text-amber-600' },
  recruiting: { label: '모집중', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  closed: { label: '모집마감', bg: 'bg-orange-50', text: 'text-orange-600' },
  in_progress: { label: '진행중', bg: 'bg-blue-50', text: 'text-blue-600' },
  reviewing: { label: '검수중', bg: 'bg-purple-50', text: 'text-purple-600' },
  completed: { label: '완료', bg: 'bg-gray-100', text: 'text-gray-600' },
  cancelled: { label: '취소', bg: 'bg-red-50', text: 'text-red-600' },
}

const platformLabels = {
  naver: '네이버',
  coupang: '쿠팡',
  both: '네이버+쿠팡',
}

export default function ReviewerCampaignDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCampaign()
      if (user) {
        fetchMyApplications()
      }
    }
  }, [id, user])

  const fetchCampaign = async () => {
    try {
      setIsLoading(true)
      setError(null)

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

  const fetchMyApplications = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('campaign_id', id)
        .eq('reviewer_id', user?.id)

      setMyApplications(data || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
    }
  }

  const handleApply = (platform: 'naver' | 'coupang') => {
    router.push(`/reviewer/campaigns/${id}/apply?platform=${platform}`)
  }

  const hasApplied = (platform: 'naver' | 'coupang') => {
    return myApplications.some(app => app.platform === platform)
  }

  const getApplicationStatus = (platform: 'naver' | 'coupang') => {
    const app = myApplications.find(app => app.platform === platform)
    return app?.status
  }

  const getDaysLeft = () => {
    if (!campaign) return 0
    const endDate = new Date(campaign.recruit_end_date)
    const today = new Date()
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Skeleton className="h-6 w-24 mb-6" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2 mb-8" />
          <Skeleton className="h-64 rounded-xl mb-6" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600">{error || '캠페인을 찾을 수 없습니다'}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const canApply = campaign.status === 'recruiting'
  const daysLeft = getDaysLeft()
  const status = statusConfig[campaign.status]

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/reviewer/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          캠페인 목록
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            {canApply && daysLeft <= 3 && daysLeft > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                D-{daysLeft}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
          <p className="text-gray-500">{campaign.product_name}</p>
        </div>

        {/* 이미지 갤러리 */}
        <ImageGallery images={campaign.product_images} productName={campaign.product_name} />


        {/* 핵심 정보 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">플랫폼</p>
                <p className="font-medium text-gray-900">{platformLabels[campaign.platform]}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">리뷰 포인트</p>
                <p className="font-medium text-emerald-600">
                  {campaign.platform === 'naver'
                    ? `${campaign.review_fee_naver.toLocaleString()}P`
                    : campaign.platform === 'coupang'
                    ? `${campaign.review_fee_coupang.toLocaleString()}P`
                    : `최대 ${Math.max(campaign.review_fee_naver, campaign.review_fee_coupang).toLocaleString()}P`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">모집인원</p>
                <p className="font-medium text-gray-900">
                  {campaign.platform === 'both'
                    ? `${campaign.recruit_count_naver + campaign.recruit_count_coupang}명`
                    : campaign.platform === 'naver'
                    ? `${campaign.recruit_count_naver}명`
                    : `${campaign.recruit_count_coupang}명`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">제품 가격</p>
                <p className="font-medium text-gray-900">{campaign.product_price.toLocaleString()}원</p>
              </div>
            </div>
          </div>
        </div>

        {/* 일정 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            일정
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">모집 기간</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(campaign.recruit_start_date).toLocaleDateString('ko-KR')} ~ {new Date(campaign.recruit_end_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">당첨 발표</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(campaign.announce_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg col-span-2">
              <p className="text-xs text-gray-500 mb-1">리뷰 마감</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* 제품 설명 */}
        {campaign.product_description && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">제품 설명</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {campaign.product_description}
            </p>
          </div>
        )}

        {/* 리뷰 가이드 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">리뷰 작성 가이드</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">최소 텍스트</p>
                <p className="text-sm font-medium text-gray-900">{campaign.min_text_length}자 이상</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">최소 사진</p>
                <p className="text-sm font-medium text-gray-900">{campaign.min_photo_count}장 이상</p>
              </div>
            </div>

            {campaign.required_keywords && campaign.required_keywords.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs text-gray-500">필수 키워드</p>
                </div>
                <div className="flex flex-wrap gap-2 ml-11">
                  {campaign.required_keywords.map((keyword, index) => (
                    <span key={index} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 신청 섹션 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">캠페인 신청</h2>

          {!canApply && (
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                {campaign.status === 'closed' && '모집이 마감된 캠페인입니다'}
                {campaign.status === 'in_progress' && '현재 진행 중인 캠페인입니다'}
                {campaign.status === 'completed' && '완료된 캠페인입니다'}
                {campaign.status === 'cancelled' && '취소된 캠페인입니다'}
                {campaign.status === 'pending' && '승인 대기 중인 캠페인입니다'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {(campaign.platform === 'naver' || campaign.platform === 'both') && (
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded">네이버</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {campaign.recruit_count_naver}명 모집 · {campaign.review_fee_naver.toLocaleString()}P
                  </p>
                </div>
                {hasApplied('naver') ? (
                  <div className="flex items-center gap-2">
                    {getApplicationStatus('naver') === 'applied' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 text-sm font-medium rounded-lg">
                        <Clock className="w-4 h-4" />
                        신청완료
                      </span>
                    )}
                    {getApplicationStatus('naver') === 'selected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        선정
                      </span>
                    )}
                    {getApplicationStatus('naver') === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg">
                        <XCircle className="w-4 h-4" />
                        미선정
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleApply('naver')}
                    disabled={!canApply}
                    className="bg-[#4F46E5] hover:bg-[#4338CA]"
                  >
                    신청하기
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            )}

            {(campaign.platform === 'coupang' || campaign.platform === 'both') && (
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded">쿠팡</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {campaign.recruit_count_coupang}명 모집 · {campaign.review_fee_coupang.toLocaleString()}P
                  </p>
                </div>
                {hasApplied('coupang') ? (
                  <div className="flex items-center gap-2">
                    {getApplicationStatus('coupang') === 'applied' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 text-sm font-medium rounded-lg">
                        <Clock className="w-4 h-4" />
                        신청완료
                      </span>
                    )}
                    {getApplicationStatus('coupang') === 'selected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        선정
                      </span>
                    )}
                    {getApplicationStatus('coupang') === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg">
                        <XCircle className="w-4 h-4" />
                        미선정
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleApply('coupang')}
                    disabled={!canApply}
                    className="bg-[#4F46E5] hover:bg-[#4338CA]"
                  >
                    신청하기
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
