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
  AlertCircle,
  Sparkles,
  Gift,
  Star,
  TrendingUp,
  Coins
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

const platformConfig = {
  naver: { label: '네이버', bg: 'bg-[#03C75A]', lightBg: 'bg-[#03C75A]/10', text: 'text-[#03C75A]' },
  coupang: { label: '쿠팡', bg: 'bg-[#E52E26]', lightBg: 'bg-[#E52E26]/10', text: 'text-[#E52E26]' },
  both: { label: '네이버+쿠팡', bg: 'bg-gray-800', lightBg: 'bg-gray-100', text: 'text-gray-800' },
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

  const handleApply = (platform: 'naver' | 'coupang' | 'both') => {
    router.push(`/reviewer/campaigns/${id}/apply?platform=${platform}`)
  }

  const hasApplied = (platform: 'naver' | 'coupang' | 'both') => {
    if (platform === 'both') {
      return myApplications.some(app => app.platform === 'both')
    }
    return myApplications.some(app => app.platform === platform)
  }

  const getApplicationStatus = (platform: 'naver' | 'coupang' | 'both') => {
    if (platform === 'both') {
      const app = myApplications.find(app => app.platform === 'both')
      return app?.status
    }
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
      <div className="min-h-screen bg-gradient-to-b from-[#FAFBFC] to-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Skeleton className="h-6 w-24 mb-6 rounded-lg" />
          <Skeleton className="h-10 w-3/4 mb-3 rounded-lg" />
          <Skeleton className="h-6 w-1/2 mb-8 rounded-lg" />
          <Skeleton className="h-72 rounded-2xl mb-6" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFBFC] to-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">오류가 발생했습니다</h3>
            <p className="text-gray-500 mb-6">{error || '캠페인을 찾을 수 없습니다'}</p>
            <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>
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
  const platform = platformConfig[campaign.platform]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFBFC] to-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/reviewer/campaigns" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          캠페인 목록
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${platform.bg} text-white`}>
              {platform.label}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            {canApply && daysLeft <= 3 && daysLeft > 0 && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                D-{daysLeft}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
          <p className="text-gray-500 text-lg">{campaign.product_name}</p>
        </div>

        {/* 이미지 갤러리 */}
        <ImageGallery images={campaign.product_images} productName={campaign.product_name} />

        {/* 핵심 정보 카드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[#4F46E5]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">플랫폼</p>
                <p className="font-bold text-gray-900">{platform.label}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">리뷰 포인트</p>
                <p className="font-bold text-emerald-600 text-lg">
                  {campaign.platform === 'naver'
                    ? `${campaign.review_fee_naver.toLocaleString()}P`
                    : campaign.platform === 'coupang'
                    ? `${campaign.review_fee_coupang.toLocaleString()}P`
                    : `최대 ${Math.max(campaign.review_fee_naver, campaign.review_fee_coupang).toLocaleString()}P`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">모집인원</p>
                <p className="font-bold text-gray-900">
                  {campaign.platform === 'both'
                    ? `${campaign.recruit_count_naver + campaign.recruit_count_coupang}명`
                    : campaign.platform === 'naver'
                    ? `${campaign.recruit_count_naver}명`
                    : `${campaign.recruit_count_coupang}명`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">제품 가격</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400 line-through">{campaign.product_price.toLocaleString()}원</p>
                  <p className="font-bold text-[#4F46E5]">무료</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 일정 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-[#4F46E5]" />
            일정
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-2">모집 기간</p>
              <p className="font-bold text-gray-900">
                {new Date(campaign.recruit_start_date).toLocaleDateString('ko-KR')} ~ {new Date(campaign.recruit_end_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-2">당첨 발표</p>
              <p className="font-bold text-gray-900">
                {new Date(campaign.announce_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 col-span-2">
              <p className="text-xs text-amber-600 font-medium mb-2">리뷰 마감</p>
              <p className="font-bold text-gray-900">
                {new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* 제품 설명 */}
        {campaign.product_description && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">제품 설명</h2>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
              {campaign.product_description}
            </p>
          </div>
        )}

        {/* 리뷰 가이드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-5 text-lg">리뷰 작성 가이드</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium mb-1">최소 텍스트</p>
                <p className="font-bold text-gray-900">{campaign.min_text_length}자 이상</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium mb-1">최소 사진</p>
                <p className="font-bold text-gray-900">{campaign.min_photo_count}장 이상</p>
              </div>
            </div>

            {campaign.required_keywords && campaign.required_keywords.length > 0 && (
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">필수 키워드</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {campaign.required_keywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1.5 bg-white text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200">
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 신청 섹션 */}
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-bold text-lg">캠페인 신청</h2>
          </div>

          {!canApply && (
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl mb-4">
              <p className="text-white/90">
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
              <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 bg-[#03C75A] text-white text-xs font-bold rounded-lg">네이버</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {campaign.recruit_count_naver}명 모집 · <span className="text-emerald-600 font-bold">{campaign.review_fee_naver.toLocaleString()}P</span>
                  </p>
                </div>
                {hasApplied('naver') ? (
                  <div className="flex items-center gap-2">
                    {getApplicationStatus('naver') === 'applied' && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 text-sm font-bold rounded-xl">
                        <Clock className="w-4 h-4" />
                        신청완료
                      </span>
                    )}
                    {getApplicationStatus('naver') === 'selected' && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl">
                        <CheckCircle className="w-4 h-4" />
                        선정됨
                      </span>
                    )}
                    {getApplicationStatus('naver') === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 text-sm font-bold rounded-xl">
                        <XCircle className="w-4 h-4" />
                        미선정
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleApply('naver')}
                    disabled={!canApply}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] rounded-xl shadow-lg"
                  >
                    신청하기
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            )}

            {(campaign.platform === 'coupang' || campaign.platform === 'both') && (
              <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 bg-[#E52E26] text-white text-xs font-bold rounded-lg">쿠팡</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {campaign.recruit_count_coupang}명 모집 · <span className="text-emerald-600 font-bold">{campaign.review_fee_coupang.toLocaleString()}P</span>
                  </p>
                </div>
                {hasApplied('coupang') ? (
                  <div className="flex items-center gap-2">
                    {getApplicationStatus('coupang') === 'applied' && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 text-sm font-bold rounded-xl">
                        <Clock className="w-4 h-4" />
                        신청완료
                      </span>
                    )}
                    {getApplicationStatus('coupang') === 'selected' && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl">
                        <CheckCircle className="w-4 h-4" />
                        선정됨
                      </span>
                    )}
                    {getApplicationStatus('coupang') === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 text-sm font-bold rounded-xl">
                        <XCircle className="w-4 h-4" />
                        미선정
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleApply('coupang')}
                    disabled={!canApply}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] rounded-xl shadow-lg"
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
