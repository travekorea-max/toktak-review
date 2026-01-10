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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Coins
} from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row'] & {
  client_profiles?: {
    company_name: string
    business_number: string
    phone: string
  }
}
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

export default function AdminCampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const campaignId = params.id as string

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
      fetchApplications()
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          client_profiles:client_id (
            company_name,
            business_number,
            phone
          )
        `)
        .eq('id', campaignId)
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
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      setApplications(data || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
    }
  }

  const handleApprove = async () => {
    if (!campaign || !user) return

    try {
      setIsProcessing(true)

      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'recruiting',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', campaign.id)

      if (error) throw error

      alert('캠페인이 승인되었습니다')
      setShowApproveDialog(false)
      fetchCampaign()
    } catch (err) {
      console.error('Error approving campaign:', err)
      alert('캠페인 승인에 실패했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!campaign || !rejectReason.trim()) {
      alert('반려 사유를 입력해주세요')
      return
    }

    try {
      setIsProcessing(true)

      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'draft',
        })
        .eq('id', campaign.id)

      if (error) throw error

      // TODO: 반려 사유를 업체에게 알림으로 전송

      alert('캠페인이 반려되었습니다')
      setShowRejectDialog(false)
      setRejectReason('')
      fetchCampaign()
    } catch (err) {
      console.error('Error rejecting campaign:', err)
      alert('캠페인 반려에 실패했습니다')
    } finally {
      setIsProcessing(false)
    }
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

  const isPending = campaign.status === 'pending'

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
          {campaign.client_profiles && (
            <p className="text-sm text-gray-500 mt-1">
              업체: {campaign.client_profiles.company_name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isPending && (
            <>
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                반려
              </Button>
              <Button onClick={() => setShowApproveDialog(true)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                승인
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            목록으로
          </Button>
        </div>
      </div>

      {/* 승인 대기 알림 */}
      {isPending && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            이 캠페인은 관리자 승인이 필요합니다. 캠페인 정보를 검토한 후 승인 또는 반려해주세요.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">캠페인 정보</TabsTrigger>
          <TabsTrigger value="client">업체 정보</TabsTrigger>
          <TabsTrigger value="applicants">
            지원자 ({applications.length})
          </TabsTrigger>
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
                <div>
                  <p className="text-sm text-gray-500 mb-1">선정 방식</p>
                  <p className="font-medium">
                    {campaign.selection_type === 'manual' && '수동 선정'}
                    {campaign.selection_type === 'auto_fcfs' && '자동 선정 (선착순)'}
                    {campaign.selection_type === 'auto_random' && '자동 선정 (랜덤)'}
                  </p>
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

        {/* 업체 정보 탭 */}
        <TabsContent value="client" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>업체 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.client_profiles ? (
                <>
                  <div>
                    <p className="text-sm text-gray-500">업체명</p>
                    <p className="font-medium">{campaign.client_profiles.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">사업자등록번호</p>
                    <p className="font-medium">{campaign.client_profiles.business_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">연락처</p>
                    <p className="font-medium">{campaign.client_profiles.phone}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">업체 정보를 불러올 수 없습니다</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 지원자 탭 */}
        <TabsContent value="applicants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>지원자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  아직 지원자가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">리뷰어 ID: {app.reviewer_id}</p>
                        <p className="text-sm text-gray-500">
                          {platformLabels[app.platform]} | {new Date(app.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div>
                        {app.status === 'applied' && (
                          <Badge variant="outline" className="bg-yellow-50">
                            <Clock className="w-3 h-3 mr-1" />
                            신청
                          </Badge>
                        )}
                        {app.status === 'selected' && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            선정
                          </Badge>
                        )}
                        {app.status === 'settled' && (
                          <Badge className="bg-[#4F46E5]">
                            <Coins className="w-3 h-3 mr-1" />
                            정산완료
                          </Badge>
                        )}
                        {app.status === 'rejected' && (
                          <Badge variant="outline">미선정</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 승인 확인 다이얼로그 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>캠페인 승인</DialogTitle>
            <DialogDescription>
              이 캠페인을 승인하시겠습니까? 승인 후 리뷰어들이 캠페인을 볼 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              취소
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? '처리 중...' : '승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 확인 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>캠페인 반려</DialogTitle>
            <DialogDescription>
              반려 사유를 입력해주세요. 업체에게 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">반려 사유 *</Label>
              <Textarea
                id="reason"
                placeholder="반려 사유를 상세히 입력해주세요"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
            >
              {isProcessing ? '처리 중...' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
