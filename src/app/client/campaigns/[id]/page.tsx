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
  Edit,
  UserCheck,
  CheckCircle,
  Clock,
  BarChart3,
  Sparkles,
  ArrowLeft,
  Tag,
  ShoppingBag,
  ChevronRight,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']
type Application = Database['public']['Tables']['applications']['Row'] & {
  reviewer_profiles?: {
    name: string
    phone: string
    rating: number
  }
}

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

export default function ClientCampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'applicants' | 'reviews'>('info')

  const campaignId = params.id as string

  useEffect(() => {
    if (campaignId && user) {
      fetchCampaign()
      fetchApplications()
    }
  }, [campaignId, user])

  const fetchCampaign = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('client_id', user?.id)
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

  const fetchApplications = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          reviewer_profiles:reviewer_id (
            name,
            phone,
            rating
          )
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      setApplications(data || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
    }
  }

  const getApplicationStats = () => {
    const total = applications.length
    const applied = applications.filter(app => app.status === 'applied').length
    const selected = applications.filter(app => app.status === 'selected').length
    const rejected = applications.filter(app => app.status === 'rejected').length

    return { total, applied, selected, rejected }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Skeleton className="h-6 w-24 mb-6" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-5xl mx-auto px-6 py-8">
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

  const stats = getApplicationStats()
  const status = statusConfig[campaign.status]

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/client/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          캠페인 목록
        </Link>

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
            <p className="text-gray-500">{campaign.product_name}</p>
          </div>
          <div className="flex gap-2">
            {(campaign.status === 'draft' || campaign.status === 'pending') && (
              <Button variant="outline" onClick={() => router.push(`/client/campaigns/${params.id}/edit`)}>
                <Edit className="w-4 h-4 mr-1.5" />
                수정
              </Button>
            )}
            {['in_progress', 'reviewing', 'completed'].includes(campaign.status) && (
              <>
                <Button
                  className="bg-[#4F46E5] hover:bg-[#4338CA]"
                  onClick={() => router.push(`/client/campaigns/${params.id}/report`)}
                >
                  <BarChart3 className="w-4 h-4 mr-1.5" />
                  결과 보고서
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/client/campaigns/${params.id}/content`)}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  2차 활용
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">총 지원자</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}명</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm text-gray-500">검토 대기</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.applied}명</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">선정</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.selected}명</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500">미선정</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.rejected}명</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'info', label: '캠페인 정보' },
            { id: 'applicants', label: `지원자 관리 (${applications.length})` },
            { id: 'reviews', label: '리뷰 관리' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">기본 정보</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* 일정 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                일정
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">리뷰 마감</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            {/* 제품 설명 */}
            {campaign.product_description && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">제품 설명</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {campaign.product_description}
                </p>
              </div>
            )}

            {/* 리뷰 가이드 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
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
          </div>
        )}

        {activeTab === 'applicants' && (
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">지원자 목록</h2>
              <Link href={`/client/campaigns/${params.id}/applicants`}>
                <Button variant="outline" size="sm">
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  지원자 관리
                </Button>
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">아직 지원자가 없습니다</h3>
                <p className="text-sm text-gray-500">캠페인이 공개되면 지원자가 표시됩니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {app.reviewer_profiles?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{app.reviewer_profiles?.name || '알 수 없음'}</p>
                        <p className="text-sm text-gray-500">
                          평점 {app.reviewer_profiles?.rating?.toFixed(1) || '0.0'} · {platformLabels[app.platform]}
                        </p>
                      </div>
                    </div>
                    <div>
                      {app.status === 'applied' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
                          <Clock className="w-3 h-3" />
                          검토대기
                        </span>
                      )}
                      {app.status === 'selected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          선정
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                          미선정
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {applications.length > 5 && (
                  <div className="p-4 text-center">
                    <Link href={`/client/campaigns/${params.id}/applicants`}>
                      <Button variant="ghost" className="text-[#4F46E5]">
                        전체 지원자 보기 ({applications.length}명)
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">리뷰 목록</h2>
              {['in_progress', 'reviewing', 'completed'].includes(campaign.status) && (
                <div className="flex gap-2">
                  <Link href={`/client/campaigns/${params.id}/report`}>
                    <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA]">
                      <BarChart3 className="w-4 h-4 mr-1.5" />
                      결과 보고서
                    </Button>
                  </Link>
                  <Link href={`/client/campaigns/${params.id}/content`}>
                    <Button variant="outline" size="sm">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      2차 활용
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">작성된 리뷰가 없습니다</h3>
              {['in_progress', 'reviewing', 'completed'].includes(campaign.status) && (
                <p className="text-sm text-gray-500">결과 보고서에서 전체 리뷰 현황을 확인하세요</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
