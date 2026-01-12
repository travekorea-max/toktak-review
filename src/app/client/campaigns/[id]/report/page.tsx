'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Download,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Search,
  Target,
  UserCheck,
} from 'lucide-react'

interface Campaign {
  id: string
  title: string
  product_name: string
  platform: string
  recruit_count_naver: number
  recruit_count_coupang: number
  review_fee_naver: number
  review_fee_coupang: number
  recruit_start_date: string
  recruit_end_date: string
  announce_date: string
  review_deadline: string
  status: string
}

interface Application {
  id: string
  reviewer_id: string
  platform: string
  status: string
  created_at: string
  reviewer_profiles: {
    name: string
    naver_id: string | null
    coupang_id: string | null
  } | null
}

interface ReviewSubmission {
  id: string
  application_id: string
  review_url: string
  platform: string
  status: string
  created_at: string
  applications: {
    reviewer_profiles: {
      name: string
    } | null
  } | null
}

const reviewStatusLabels: Record<string, string> = {
  pending: '검토대기',
  ai_passed: 'AI 통과',
  needs_review: '수동검토 필요',
  approved: '승인완료',
  revision_requested: '수정요청',
  rejected: '반려',
}

const platformLabels = {
  naver: '네이버',
  coupang: '쿠팡',
  both: '네이버+쿠팡',
}

export default function CampaignReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [reviews, setReviews] = useState<ReviewSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id && user) {
      fetchReportData()
    }
  }, [id, user])

  const fetchReportData = async () => {
    try {
      setLoading(true)

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .eq('client_id', user?.id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          id,
          reviewer_id,
          platform,
          status,
          created_at,
          reviewer_profiles:reviewer_id (
            name,
            naver_id,
            coupang_id
          )
        `)
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })

      setApplications(applicationsData || [])

      const applicationIds = (applicationsData || []).map(app => app.id)
      if (applicationIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('review_submissions')
          .select(`
            id,
            application_id,
            review_url,
            platform,
            status,
            created_at,
            applications:application_id (
              reviewer_profiles:reviewer_id (
                name
              )
            )
          `)
          .in('application_id', applicationIds)
          .order('created_at', { ascending: false })

        setReviews(reviewsData || [])
      }
    } catch (err) {
      console.error('Error fetching report data:', err)
      setError('보고서 데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (!campaign) return null

    let totalRecruitCount = 0
    if (campaign.platform === 'naver' || campaign.platform === 'both') {
      totalRecruitCount += campaign.recruit_count_naver
    }
    if (campaign.platform === 'coupang' || campaign.platform === 'both') {
      totalRecruitCount += campaign.recruit_count_coupang
    }

    const totalApplications = applications.length
    const selectedApplications = applications.filter(app => app.status === 'selected').length
    const applicationRate = totalRecruitCount > 0
      ? Math.round((totalApplications / totalRecruitCount) * 100)
      : 0
    const selectionRate = totalApplications > 0
      ? Math.round((selectedApplications / totalApplications) * 100)
      : 0

    const totalReviews = reviews.length
    const approvedReviews = reviews.filter(r => r.status === 'approved').length
    const pendingReviews = reviews.filter(r => ['pending', 'ai_passed', 'needs_review'].includes(r.status)).length
    const rejectedReviews = reviews.filter(r => r.status === 'rejected').length
    const revisionReviews = reviews.filter(r => r.status === 'revision_requested').length

    const reviewSubmissionRate = selectedApplications > 0
      ? Math.round((totalReviews / selectedApplications) * 100)
      : 0
    const reviewApprovalRate = totalReviews > 0
      ? Math.round((approvedReviews / totalReviews) * 100)
      : 0

    return {
      totalRecruitCount,
      totalApplications,
      selectedApplications,
      applicationRate,
      selectionRate,
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      revisionReviews,
      reviewSubmissionRate,
      reviewApprovalRate,
    }
  }

  const downloadCSV = () => {
    if (!campaign || reviews.length === 0) return

    const csvRows = [
      ['리뷰어', '플랫폼', '리뷰 URL', '상태', '제출일시'].join(','),
      ...reviews.map(review => {
        const reviewerName = review.applications?.reviewer_profiles?.name || '알 수 없음'
        const platform = platformLabels[review.platform as keyof typeof platformLabels] || review.platform
        const status = reviewStatusLabels[review.status] || review.status
        const createdAt = new Date(review.created_at).toLocaleDateString('ko-KR')
        return [
          `"${reviewerName}"`,
          platform,
          `"${review.review_url}"`,
          status,
          createdAt,
        ].join(',')
      }),
    ]

    const csvContent = '\uFEFF' + csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${campaign.title}_결과보고서_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const stats = calculateStats()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'ai_passed':
      case 'needs_review':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
          <Clock className="w-3 h-3" />
          {reviewStatusLabels[status]}
        </span>
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          {reviewStatusLabels[status]}
        </span>
      case 'revision_requested':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-medium rounded-full">
          <AlertCircle className="w-3 h-3" />
          {reviewStatusLabels[status]}
        </span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
          <XCircle className="w-3 h-3" />
          {reviewStatusLabels[status]}
        </span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign || !stats) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error || '캠페인을 찾을 수 없습니다'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/client/campaigns/${id}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">캠페인 결과 보고서</h1>
              <p className="text-sm text-gray-500">{campaign.title}</p>
            </div>
          </div>
          <Button
            onClick={downloadCSV}
            disabled={reviews.length === 0}
            className="bg-[#4F46E5] hover:bg-[#4338CA]"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV 다운로드
          </Button>
        </div>

        {/* 캠페인 개요 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4F46E5]" />
            <h2 className="font-semibold text-gray-900">캠페인 개요</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">제품명</p>
                <p className="font-medium text-gray-900">{campaign.product_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">플랫폼</p>
                <p className="font-medium text-gray-900">
                  {platformLabels[campaign.platform as keyof typeof platformLabels]}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">모집 기간</p>
                <p className="font-medium text-gray-900">
                  {new Date(campaign.recruit_start_date).toLocaleDateString('ko-KR')} ~{' '}
                  {new Date(campaign.recruit_end_date).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">리뷰 마감</p>
                <p className="font-medium text-gray-900">
                  {new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 성과 요약 */}
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5" />
            <h2 className="font-semibold">캠페인 성과 요약</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalApplications}</p>
              <p className="text-sm text-white/80 mt-1">총 지원자</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{stats.approvedReviews}</p>
              <p className="text-sm text-white/80 mt-1">완료된 리뷰</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{stats.reviewSubmissionRate}%</p>
              <p className="text-sm text-white/80 mt-1">리뷰 제출률</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{stats.reviewApprovalRate}%</p>
              <p className="text-sm text-white/80 mt-1">리뷰 승인률</p>
            </div>
          </div>
        </div>

        {/* 상세 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 모집 현황 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">모집 현황</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecruitCount}</p>
                  <p className="text-xs text-gray-500">목표 인원</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                  <p className="text-xs text-gray-500">총 지원자</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <UserCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.selectedApplications}</p>
                  <p className="text-xs text-gray-500">선정 인원</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-50">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">지원율</span>
                    <span className="font-medium text-gray-900">{stats.applicationRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4F46E5] rounded-full transition-all"
                      style={{ width: `${Math.min(stats.applicationRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">선정률</span>
                    <span className="font-medium text-gray-900">{stats.selectionRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${stats.selectionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 리뷰 현황 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">리뷰 현황</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                  <p className="text-xs text-gray-500">제출된 리뷰</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedReviews}</p>
                  <p className="text-xs text-gray-500">승인 완료</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
                  <p className="text-xs text-gray-500">검토 중</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-50">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">리뷰 제출률</span>
                    <span className="font-medium text-gray-900">{stats.reviewSubmissionRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4F46E5] rounded-full transition-all"
                      style={{ width: `${stats.reviewSubmissionRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">리뷰 승인률</span>
                    <span className="font-medium text-gray-900">{stats.reviewApprovalRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${stats.reviewApprovalRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {(stats.rejectedReviews > 0 || stats.revisionReviews > 0) && (
                <div className="flex gap-3 pt-3 border-t border-gray-50">
                  {stats.revisionReviews > 0 && (
                    <div className="flex items-center gap-1 text-sm text-purple-600">
                      <AlertCircle className="w-4 h-4" />
                      수정요청: {stats.revisionReviews}건
                    </div>
                  )}
                  {stats.rejectedReviews > 0 && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <XCircle className="w-4 h-4" />
                      반려: {stats.rejectedReviews}건
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 리뷰 URL 목록 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">리뷰 URL 목록</h2>
            </div>
            <span className="text-sm text-gray-500">총 {reviews.length}건</span>
          </div>

          {reviews.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">아직 제출된 리뷰가 없습니다</p>
            </div>
          ) : (
            <>
              {/* 테이블 헤더 */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500">
                <div className="col-span-2">리뷰어</div>
                <div className="col-span-2">플랫폼</div>
                <div className="col-span-4">리뷰 URL</div>
                <div className="col-span-2">상태</div>
                <div className="col-span-2">제출일</div>
              </div>

              {/* 리스트 */}
              <div className="divide-y divide-gray-50">
                {reviews.map((review) => (
                  <div key={review.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-6 md:col-span-2">
                      <p className="font-medium text-gray-900">
                        {review.applications?.reviewer_profiles?.name || '알 수 없음'}
                      </p>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      {review.platform === 'naver' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03C75A]/10 text-[#03C75A] text-xs font-medium rounded">
                          <span className="w-4 h-4 bg-[#03C75A] text-white text-[10px] font-bold rounded flex items-center justify-center">N</span>
                          네이버
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E53935]/10 text-[#E53935] text-xs font-medium rounded">
                          <span className="w-4 h-4 bg-[#E53935] text-white text-[10px] font-bold rounded flex items-center justify-center">C</span>
                          쿠팡
                        </span>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <a
                        href={review.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-[#4F46E5] hover:underline truncate"
                      >
                        <span className="truncate">{review.review_url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 안내 사항 */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex gap-3 text-sm text-gray-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#4F46E5]" />
            <div className="space-y-1">
              <p>리뷰 URL을 클릭하면 해당 리뷰 페이지로 이동합니다.</p>
              <p>CSV 다운로드를 통해 리뷰 목록을 엑셀에서 확인할 수 있습니다.</p>
              <p>승인된 리뷰에 대해서만 리뷰어에게 포인트가 지급됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
