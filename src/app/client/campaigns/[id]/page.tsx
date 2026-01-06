'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Edit,
  UserCheck,
  CheckCircle,
  Clock,
  BarChart3,
  Sparkles,
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

const statusLabels: Record<Campaign['status'], string> = {
  draft: '임시저장',
  pending: '승인대기',
  recruiting: '모집중',
  closed: '모집마감',
  in_progress: '진행중',
  reviewing: '검수중',
  completed: '완료',
  cancelled: '취소',
}

const statusColors: Record<Campaign['status'], string> = {
  draft: 'bg-gray-500',
  pending: 'bg-yellow-500',
  recruiting: 'bg-green-500',
  closed: 'bg-orange-500',
  in_progress: 'bg-blue-500',
  reviewing: 'bg-purple-500',
  completed: 'bg-gray-700',
  cancelled: 'bg-red-500',
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
        .eq('client_id', user?.id) // 본인의 캠페인만 조회
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || '캠페인을 찾을 수 없습니다'}</AlertDescription>
      </Alert>
    )
  }

  const stats = getApplicationStats()

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <Badge className={statusColors[campaign.status]}>
              {statusLabels[campaign.status]}
            </Badge>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">{campaign.product_name}</p>
        </div>
        <div className="flex gap-2">
          {(campaign.status === 'draft' || campaign.status === 'pending') && (
            <Button onClick={() => router.push(`/campaigns/${params.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
          )}
          {['in_progress', 'reviewing', 'completed'].includes(campaign.status) && (
            <>
              <Button
                variant="default"
                onClick={() => router.push(`/client/campaigns/${params.id}/report`)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                결과 보고서
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/client/campaigns/${params.id}/content`)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                2차 활용
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            목록으로
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 지원자</CardDescription>
            <CardTitle className="text-3xl">{stats.total}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>검토 대기</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.applied}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>선정</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.selected}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>미선정</CardDescription>
            <CardTitle className="text-3xl text-gray-600">{stats.rejected}명</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">캠페인 정보</TabsTrigger>
          <TabsTrigger value="applicants">
            지원자 관리 ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">리뷰 관리</TabsTrigger>
        </TabsList>

        {/* 캠페인 정보 탭 */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">플랫폼</p>
                    <p className="font-medium">{platformLabels[campaign.platform]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">모집인원</p>
                    <p className="font-medium">
                      {campaign.platform === 'both'
                        ? `네이버 ${campaign.recruit_count_naver}명 / 쿠팡 ${campaign.recruit_count_coupang}명`
                        : campaign.platform === 'naver'
                        ? `${campaign.recruit_count_naver}명`
                        : `${campaign.recruit_count_coupang}명`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">리뷰 포인트</p>
                    <p className="font-medium">
                      {campaign.platform === 'both'
                        ? `네이버 ${campaign.review_fee_naver.toLocaleString()}원 / 쿠팡 ${campaign.review_fee_coupang.toLocaleString()}원`
                        : campaign.platform === 'naver'
                        ? `${campaign.review_fee_naver.toLocaleString()}원`
                        : `${campaign.review_fee_coupang.toLocaleString()}원`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">제품 가격</p>
                    <p className="font-medium">{campaign.product_price.toLocaleString()}원</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">모집 기간</p>
                  <p className="font-medium">
                    {new Date(campaign.recruit_start_date).toLocaleDateString('ko-KR')} ~ {new Date(campaign.recruit_end_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">당첨자 발표</p>
                  <p className="font-medium">{new Date(campaign.announce_date).toLocaleDateString('ko-KR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">리뷰 작성 마감</p>
                  <p className="font-medium">{new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {campaign.product_description && (
            <Card>
              <CardHeader>
                <CardTitle>제품 설명</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {campaign.product_description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>리뷰 작성 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">최소 텍스트 길이</p>
                  <p className="font-medium">{campaign.min_text_length}자 이상</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">최소 사진 개수</p>
                  <p className="font-medium">{campaign.min_photo_count}장 이상</p>
                </div>
              </div>

              {campaign.required_keywords && campaign.required_keywords.length > 0 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">필수 키워드</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.required_keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 지원자 관리 탭 */}
        <TabsContent value="applicants" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>지원자 목록</CardTitle>
                <Link href={`/campaigns/${params.id}/applicants`}>
                  <Button variant="outline">
                    <UserCheck className="w-4 h-4 mr-2" />
                    지원자 관리
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  아직 지원자가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{app.reviewer_profiles?.name || '알 수 없음'}</p>
                          <p className="text-sm text-gray-500">
                            평점: {app.reviewer_profiles?.rating.toFixed(1) || '0.0'} | {platformLabels[app.platform]}
                          </p>
                        </div>
                      </div>
                      <div>
                        {app.status === 'applied' && (
                          <Badge variant="outline" className="bg-yellow-50">
                            <Clock className="w-3 h-3 mr-1" />
                            검토대기
                          </Badge>
                        )}
                        {app.status === 'selected' && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            선정
                          </Badge>
                        )}
                        {app.status === 'rejected' && (
                          <Badge variant="outline">미선정</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {applications.length > 5 && (
                    <Link href={`/campaigns/${params.id}/applicants`}>
                      <Button variant="link" className="w-full">
                        전체 지원자 보기 ({applications.length}명)
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 리뷰 관리 탭 */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>리뷰 목록</CardTitle>
                {['in_progress', 'reviewing', 'completed'].includes(campaign.status) && (
                  <div className="flex gap-2">
                    <Link href={`/client/campaigns/${params.id}/report`}>
                      <Button>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        결과 보고서
                      </Button>
                    </Link>
                    <Link href={`/client/campaigns/${params.id}/content`}>
                      <Button variant="outline">
                        <Sparkles className="w-4 h-4 mr-2" />
                        2차 활용
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>작성된 리뷰가 없습니다</p>
                {['in_progress', 'reviewing', 'completed'].includes(campaign.status) && (
                  <p className="mt-2 text-sm">결과 보고서에서 전체 리뷰 현황을 확인하세요</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
