'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
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
  Coins,
  X,
  Building,
  Phone,
  Hash,
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
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-600',
  recruiting: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-orange-50 text-orange-600',
  in_progress: 'bg-blue-50 text-blue-600',
  reviewing: 'bg-purple-50 text-purple-600',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
}

const platformLabels = {
  naver: '네이버',
  coupang: '쿠팡',
  both: '네이버+쿠팡',
}

const tabs = [
  { id: 'info', label: '캠페인 정보' },
  { id: 'client', label: '업체 정보' },
  { id: 'applicants', label: '지원자' },
]

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
  const [activeTab, setActiveTab] = useState('info')

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
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-8" />
          <Skeleton className="h-64 rounded-xl mb-6" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">{error || '캠페인을 찾을 수 없습니다'}</p>
          </div>
        </div>
      </div>
    )
  }

  const isPending = campaign.status === 'pending'

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          캠페인 목록으로
        </Link>

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{campaign.title}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}>
                {statusLabels[campaign.status]}
              </span>
            </div>
            <p className="text-gray-500">{campaign.product_name}</p>
            {campaign.client_profiles && (
              <p className="text-sm text-gray-400 mt-1">
                업체: {campaign.client_profiles.company_name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isPending && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  반려
                </Button>
                <Button
                  className="bg-[#4F46E5] hover:bg-[#4338CA]"
                  onClick={() => setShowApproveDialog(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  승인
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 승인 대기 알림 */}
        {isPending && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-700">
              이 캠페인은 관리자 승인이 필요합니다. 캠페인 정보를 검토한 후 승인 또는 반려해주세요.
            </p>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.id === 'applicants' && (
                <span className={`ml-1.5 ${activeTab === tab.id ? 'text-white/80' : 'text-gray-400'}`}>
                  {applications.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 캠페인 정보 탭 */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900">기본 정보</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <Users className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">모집인원</p>
                      <p className="font-medium text-gray-900">
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
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">리뷰 포인트</p>
                      <p className="font-medium text-gray-900">
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
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">제품 가격</p>
                      <p className="font-medium text-gray-900">{campaign.product_price.toLocaleString()}원</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 mt-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">모집 기간</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(campaign.recruit_start_date).toLocaleDateString('ko-KR')} ~ {new Date(campaign.recruit_end_date).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">당첨자 발표</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(campaign.announce_date).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">리뷰 작성 마감</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">선정 방식</p>
                      <p className="text-sm font-medium text-gray-900">
                        {campaign.selection_type === 'manual' && '수동 선정'}
                        {campaign.selection_type === 'auto_fcfs' && '자동 선정 (선착순)'}
                        {campaign.selection_type === 'auto_random' && '자동 선정 (랜덤)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 제품 설명 */}
            {campaign.product_description && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900">제품 설명</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {campaign.product_description}
                  </p>
                </div>
              </div>
            )}

            {/* 리뷰 작성 가이드 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900">리뷰 작성 가이드</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">최소 텍스트 길이</p>
                    <p className="text-sm font-medium text-gray-900">{campaign.min_text_length}자 이상</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">최소 사진 개수</p>
                    <p className="text-sm font-medium text-gray-900">{campaign.min_photo_count}장 이상</p>
                  </div>
                </div>

                {campaign.required_keywords && campaign.required_keywords.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">필수 키워드</p>
                      <div className="flex flex-wrap gap-2">
                        {campaign.required_keywords.map((keyword, index) => (
                          <span key={index} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 업체 정보 탭 */}
        {activeTab === 'client' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">업체 정보</h2>
            </div>
            <div className="p-5">
              {campaign.client_profiles ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">업체명</p>
                      <p className="font-medium text-gray-900">{campaign.client_profiles.company_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Hash className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">사업자등록번호</p>
                      <p className="font-medium text-gray-900">{campaign.client_profiles.business_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">연락처</p>
                      <p className="font-medium text-gray-900">{campaign.client_profiles.phone}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">업체 정보를 불러올 수 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 지원자 탭 */}
        {activeTab === 'applicants' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">지원자 목록</h2>
            </div>
            {applications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">아직 지원자가 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">리뷰어 ID: {app.reviewer_id.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-500">
                        {platformLabels[app.platform]} | {new Date(app.created_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      {app.status === 'applied' && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          신청
                        </span>
                      )}
                      {app.status === 'selected' && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          선정
                        </span>
                      )}
                      {app.status === 'settled' && (
                        <span className="px-2.5 py-1 bg-[#EEF2FF] text-[#4F46E5] text-xs font-medium rounded-full flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          정산완료
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          미선정
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 승인 확인 모달 */}
      {showApproveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">캠페인 승인</h2>
              <button
                onClick={() => setShowApproveDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                이 캠페인을 승인하시겠습니까? 승인 후 리뷰어들이 캠페인을 볼 수 있습니다.
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowApproveDialog(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA]"
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? '처리 중...' : '승인'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 반려 확인 모달 */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">캠페인 반려</h2>
              <button
                onClick={() => setShowRejectDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                반려 사유를 입력해주세요. 업체에게 전달됩니다.
              </p>
              <div>
                <Label htmlFor="reason" className="text-sm font-medium text-gray-700">반려 사유 *</Label>
                <Textarea
                  id="reason"
                  placeholder="반려 사유를 상세히 입력해주세요"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={5}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectDialog(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
              >
                {isProcessing ? '처리 중...' : '반려'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
