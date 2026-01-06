'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']
type Application = Database['public']['Tables']['applications']['Row']

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

  const canApply = campaign.status === 'recruiting'

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
        <Button variant="outline" onClick={() => router.back()}>
          목록으로
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>캠페인 정보</CardTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">모집 시작</p>
              <p className="font-medium">{new Date(campaign.recruit_start_date).toLocaleDateString('ko-KR')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">모집 마감</p>
              <p className="font-medium">{new Date(campaign.recruit_end_date).toLocaleDateString('ko-KR')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">당첨자 발표</p>
              <p className="font-medium">{new Date(campaign.announce_date).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">리뷰 작성 마감</p>
            <p className="font-medium">{new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}</p>
          </div>
        </CardContent>
      </Card>

      {/* 제품 설명 */}
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

      {/* 리뷰 가이드 */}
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

          {campaign.review_guide && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{JSON.stringify(campaign.review_guide)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 신청 버튼 */}
      <Card>
        <CardHeader>
          <CardTitle>캠페인 신청</CardTitle>
          <CardDescription>
            원하는 플랫폼을 선택하여 캠페인에 신청하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canApply && (
            <Alert>
              <AlertDescription>
                {campaign.status === 'closed' && '모집이 마감된 캠페인입니다'}
                {campaign.status === 'in_progress' && '현재 진행 중인 캠페인입니다'}
                {campaign.status === 'completed' && '완료된 캠페인입니다'}
                {campaign.status === 'cancelled' && '취소된 캠페인입니다'}
                {campaign.status === 'pending' && '승인 대기 중인 캠페인입니다'}
              </AlertDescription>
            </Alert>
          )}

          {(campaign.platform === 'naver' || campaign.platform === 'both') && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">네이버 플랫폼</p>
                <p className="text-sm text-gray-500">
                  모집인원: {campaign.recruit_count_naver}명 | 포인트: {campaign.review_fee_naver.toLocaleString()}원
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasApplied('naver') ? (
                  <div className="flex items-center gap-2">
                    {getApplicationStatus('naver') === 'applied' && (
                      <Badge variant="outline" className="bg-yellow-50">
                        <Clock className="w-3 h-3 mr-1" />
                        신청완료
                      </Badge>
                    )}
                    {getApplicationStatus('naver') === 'selected' && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        선정
                      </Badge>
                    )}
                    {getApplicationStatus('naver') === 'rejected' && (
                      <Badge variant="outline" className="bg-red-50">
                        <XCircle className="w-3 h-3 mr-1" />
                        미선정
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleApply('naver')}
                    disabled={!canApply}
                  >
                    신청하기
                  </Button>
                )}
              </div>
            </div>
          )}

          {(campaign.platform === 'coupang' || campaign.platform === 'both') && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">쿠팡 플랫폼</p>
                <p className="text-sm text-gray-500">
                  모집인원: {campaign.recruit_count_coupang}명 | 포인트: {campaign.review_fee_coupang.toLocaleString()}원
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasApplied('coupang') ? (
                  <div className="flex items-center gap-2">
                    {getApplicationStatus('coupang') === 'applied' && (
                      <Badge variant="outline" className="bg-yellow-50">
                        <Clock className="w-3 h-3 mr-1" />
                        신청완료
                      </Badge>
                    )}
                    {getApplicationStatus('coupang') === 'selected' && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        선정
                      </Badge>
                    )}
                    {getApplicationStatus('coupang') === 'rejected' && (
                      <Badge variant="outline" className="bg-red-50">
                        <XCircle className="w-3 h-3 mr-1" />
                        미선정
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleApply('coupang')}
                    disabled={!canApply}
                  >
                    신청하기
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
