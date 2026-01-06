'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Download,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  BarChart3,
  TrendingUp,
  AlertCircle,
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

const reviewStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  ai_passed: 'bg-blue-100 text-blue-800',
  needs_review: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  revision_requested: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
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

      // 캠페인 정보 조회
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .eq('client_id', user?.id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // 신청자 정보 조회
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

      // 리뷰 제출 정보 조회
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

  // 통계 계산
  const calculateStats = () => {
    if (!campaign) return null

    // 총 모집 인원
    let totalRecruitCount = 0
    if (campaign.platform === 'naver' || campaign.platform === 'both') {
      totalRecruitCount += campaign.recruit_count_naver
    }
    if (campaign.platform === 'coupang' || campaign.platform === 'both') {
      totalRecruitCount += campaign.recruit_count_coupang
    }

    // 신청자 통계
    const totalApplications = applications.length
    const selectedApplications = applications.filter(app => app.status === 'selected').length
    const applicationRate = totalRecruitCount > 0
      ? Math.round((totalApplications / totalRecruitCount) * 100)
      : 0
    const selectionRate = totalApplications > 0
      ? Math.round((selectedApplications / totalApplications) * 100)
      : 0

    // 리뷰 통계
    const totalReviews = reviews.length
    const approvedReviews = reviews.filter(r => r.status === 'approved').length
    const pendingReviews = reviews.filter(r => ['pending', 'ai_passed', 'needs_review'].includes(r.status)).length
    const rejectedReviews = reviews.filter(r => r.status === 'rejected').length
    const revisionReviews = reviews.filter(r => r.status === 'revision_requested').length

    // 리뷰 완료율 (선정된 인원 대비)
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

  // CSV 다운로드
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

    const csvContent = '\uFEFF' + csvRows.join('\n') // BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${campaign.title}_결과보고서_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !campaign || !stats) {
    return (
      <div className="max-w-5xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error || '캠페인을 찾을 수 없습니다'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">캠페인 결과 보고서</h1>
            <p className="text-gray-600 dark:text-gray-400">{campaign.title}</p>
          </div>
        </div>
        <Button onClick={downloadCSV} disabled={reviews.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          CSV 다운로드
        </Button>
      </div>

      {/* 캠페인 요약 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            캠페인 개요
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">제품명</span>
              <p className="font-medium">{campaign.product_name}</p>
            </div>
            <div>
              <span className="text-gray-500">플랫폼</span>
              <p className="font-medium">
                <Badge variant="outline">
                  {platformLabels[campaign.platform as keyof typeof platformLabels]}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-gray-500">모집 기간</span>
              <p className="font-medium">
                {new Date(campaign.recruit_start_date).toLocaleDateString('ko-KR')} ~{' '}
                {new Date(campaign.recruit_end_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div>
              <span className="text-gray-500">리뷰 마감</span>
              <p className="font-medium">
                {new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 참여 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 모집 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              모집 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.totalRecruitCount}</p>
                <p className="text-sm text-gray-500">목표 인원</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">{stats.totalApplications}</p>
                <p className="text-sm text-gray-500">총 지원자</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.selectedApplications}</p>
                <p className="text-sm text-gray-500">선정 인원</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>지원율 (지원자/목표)</span>
                  <span className="font-medium">{stats.applicationRate}%</span>
                </div>
                <Progress value={Math.min(stats.applicationRate, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>선정률 (선정/지원)</span>
                  <span className="font-medium">{stats.selectionRate}%</span>
                </div>
                <Progress value={stats.selectionRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 리뷰 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              리뷰 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
                <p className="text-sm text-gray-500">제출된 리뷰</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.approvedReviews}</p>
                <p className="text-sm text-gray-500">승인 완료</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingReviews}</p>
                <p className="text-sm text-gray-500">검토 중</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>리뷰 제출률 (제출/선정)</span>
                  <span className="font-medium">{stats.reviewSubmissionRate}%</span>
                </div>
                <Progress value={stats.reviewSubmissionRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>리뷰 승인률 (승인/제출)</span>
                  <span className="font-medium">{stats.reviewApprovalRate}%</span>
                </div>
                <Progress value={stats.reviewApprovalRate} className="h-2" />
              </div>
            </div>

            {(stats.rejectedReviews > 0 || stats.revisionReviews > 0) && (
              <>
                <Separator />
                <div className="flex gap-4 text-sm">
                  {stats.revisionReviews > 0 && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <AlertCircle className="h-4 w-4" />
                      수정요청: {stats.revisionReviews}건
                    </div>
                  )}
                  {stats.rejectedReviews > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      반려: {stats.rejectedReviews}건
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 성과 요약 */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">캠페인 성과 요약</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-4xl font-bold text-blue-600">{stats.totalApplications}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">총 지원자 수</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-4xl font-bold text-green-600">{stats.approvedReviews}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">완료된 리뷰</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-4xl font-bold text-purple-600">{stats.reviewSubmissionRate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">리뷰 제출률</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-4xl font-bold text-orange-600">{stats.reviewApprovalRate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">리뷰 승인률</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리뷰 URL 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">리뷰 URL 목록</CardTitle>
              <CardDescription>
                총 {reviews.length}건의 리뷰가 제출되었습니다
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">아직 제출된 리뷰가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">리뷰어</TableHead>
                    <TableHead className="w-[80px]">플랫폼</TableHead>
                    <TableHead>리뷰 URL</TableHead>
                    <TableHead className="w-[100px]">상태</TableHead>
                    <TableHead className="w-[100px]">제출일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.applications?.reviewer_profiles?.name || '알 수 없음'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {platformLabels[review.platform as keyof typeof platformLabels] || review.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a
                          href={review.review_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline max-w-md truncate"
                        >
                          {review.review_url}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge className={reviewStatusColors[review.status]}>
                          {review.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {review.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                          {['pending', 'ai_passed', 'needs_review'].includes(review.status) && <Clock className="h-3 w-3 mr-1" />}
                          {reviewStatusLabels[review.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 사항 */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-500" />
            <div className="space-y-1">
              <p>• 리뷰 URL을 클릭하면 해당 리뷰 페이지로 이동합니다.</p>
              <p>• CSV 다운로드를 통해 리뷰 목록을 엑셀에서 확인할 수 있습니다.</p>
              <p>• 승인된 리뷰에 대해서만 리뷰어에게 포인트가 지급됩니다.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
