'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Package,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Search,
} from 'lucide-react'

interface Campaign {
  id: string
  title: string
  product_name: string
  platform: string
  status: string
}

interface ReviewContent {
  id: string
  application_id: string
  review_url: string
  image_url: string
  platform: string
  status: string
  created_at: string
  reviewer_name: string
  reviewer_id: string
  is_used: boolean
}

const platformLabels = {
  naver: '네이버',
  coupang: '쿠팡',
  both: '네이버+쿠팡',
}

export default function SecondaryContentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [contents, setContents] = useState<ReviewContent[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (id && user) {
      fetchData()
    }
  }, [id, user])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, title, product_name, platform, status')
        .eq('id', id)
        .eq('client_id', user?.id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      const { data: applications } = await supabase
        .from('applications')
        .select('id, reviewer_id')
        .eq('campaign_id', id)
        .eq('status', 'selected')

      if (!applications || applications.length === 0) {
        setContents([])
        return
      }

      const { data: reviews } = await supabase
        .from('review_submissions')
        .select(`
          id,
          application_id,
          review_url,
          image_url,
          platform,
          status,
          created_at
        `)
        .in('application_id', applications.map(a => a.id))
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (!reviews) {
        setContents([])
        return
      }

      const reviewerIds = [...new Set(applications.map(a => a.reviewer_id))]
      const { data: reviewerProfiles } = await supabase
        .from('reviewer_profiles')
        .select('user_id, name')
        .in('user_id', reviewerIds)

      const reviewerMap = new Map(
        reviewerProfiles?.map(r => [r.user_id, r.name]) || []
      )

      const { data: usageRecords } = await supabase
        .from('content_usage')
        .select('review_id')
        .eq('campaign_id', id)

      const usedReviewIds = new Set(usageRecords?.map(u => u.review_id) || [])

      const contentList: ReviewContent[] = reviews.map(review => {
        const application = applications.find(a => a.id === review.application_id)
        return {
          ...review,
          reviewer_name: reviewerMap.get(application?.reviewer_id || '') || '알 수 없음',
          reviewer_id: application?.reviewer_id || '',
          is_used: usedReviewIds.has(review.id),
        }
      })

      setContents(contentList)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === contents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(contents.map(c => c.id))
    }
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleExport = async () => {
    if (selectedIds.length === 0) return

    try {
      setExporting(true)

      const selectedContents = contents.filter(c => selectedIds.includes(c.id))

      const csvRows = [
        ['리뷰어', '플랫폼', '리뷰 URL', '이미지 URL', '등록일'].join(','),
        ...selectedContents.map(content => [
          `"${content.reviewer_name}"`,
          platformLabels[content.platform as keyof typeof platformLabels] || content.platform,
          `"${content.review_url}"`,
          `"${content.image_url}"`,
          new Date(content.created_at).toLocaleDateString('ko-KR'),
        ].join(','))
      ]

      const csvContent = '\uFEFF' + csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campaign?.title}_2차활용콘텐츠_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)

      for (const content of selectedContents) {
        await supabase.from('content_usage').upsert({
          campaign_id: id,
          review_id: content.id,
          used_at: new Date().toISOString(),
        }, {
          onConflict: 'campaign_id,review_id'
        })
      }

      setContents(prev =>
        prev.map(c =>
          selectedIds.includes(c.id) ? { ...c, is_used: true } : c
        )
      )

      setShowExportDialog(false)
      setSelectedIds([])
    } catch (err) {
      console.error('Export error:', err)
      setError('내보내기에 실패했습니다')
    } finally {
      setExporting(false)
    }
  }

  const approvedCount = contents.length
  const usedCount = contents.filter(c => c.is_used).length

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

  if (error || !campaign) {
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
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                2차 활용 콘텐츠
              </h1>
              <p className="text-sm text-gray-500">{campaign.title}</p>
            </div>
          </div>
          <Button
            onClick={() => setShowExportDialog(true)}
            disabled={selectedIds.length === 0}
            className="bg-[#4F46E5] hover:bg-[#4338CA]"
          >
            <Package className="w-4 h-4 mr-2" />
            내보내기 ({selectedIds.length})
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                <p className="text-xs text-gray-500">승인된 리뷰</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{usedCount}</p>
                <p className="text-xs text-gray-500">2차 활용됨</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{approvedCount - usedCount}</p>
                <p className="text-xs text-gray-500">미사용</p>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-700">
              <p className="font-medium mb-1">2차 활용 콘텐츠란?</p>
              <p>리뷰어가 작성한 리뷰 콘텐츠(사진, 텍스트)를 광고, SNS, 상세페이지 등에 재사용할 수 있습니다.</p>
              <p className="mt-1">승인된 리뷰만 2차 활용이 가능하며, 콘텐츠 사용 시 출처를 명시해주세요.</p>
            </div>
          </div>
        </div>

        {/* 콘텐츠 목록 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">콘텐츠 목록</h2>
            </div>
            {contents.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8">
                {selectedIds.length === contents.length ? '전체 해제' : '전체 선택'}
              </Button>
            )}
          </div>

          {contents.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">승인된 리뷰 콘텐츠가 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">리뷰가 승인되면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {contents.map((content) => (
                <div
                  key={content.id}
                  className={`p-5 transition-colors ${
                    selectedIds.includes(content.id)
                      ? 'bg-[#EEF2FF]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 체크박스 */}
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedIds.includes(content.id)}
                        onCheckedChange={() => handleSelect(content.id)}
                      />
                    </div>

                    {/* 이미지 미리보기 */}
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {content.image_url ? (
                        <img
                          src={content.image_url}
                          alt="리뷰 이미지"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* 콘텐츠 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{content.reviewer_name}</span>
                        {content.platform === 'naver' ? (
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
                        {content.is_used && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            활용됨
                          </span>
                        )}
                      </div>

                      {/* 리뷰 URL */}
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={content.review_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#4F46E5] hover:underline truncate"
                        >
                          {content.review_url}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => copyToClipboard(content.review_url, `url-${content.id}`)}
                        >
                          {copiedId === `url-${content.id}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </Button>
                        <a
                          href={content.review_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </Button>
                        </a>
                      </div>

                      {/* 이미지 URL */}
                      {content.image_url && (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500 truncate">
                            {content.image_url}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => copyToClipboard(content.image_url, `img-${content.id}`)}
                          >
                            {copiedId === `img-${content.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </Button>
                          <a
                            href={content.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                              <Download className="w-3 h-3 text-gray-400" />
                            </Button>
                          </a>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        등록일: {new Date(content.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 사용 안내 */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex gap-3 text-sm text-gray-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#4F46E5]" />
            <div className="space-y-1">
              <p>콘텐츠를 선택하고 "내보내기"를 클릭하면 CSV 파일로 다운로드됩니다.</p>
              <p>리뷰 URL을 클릭하면 원본 리뷰 페이지로 이동합니다.</p>
              <p>이미지는 개별 다운로드하거나 URL을 복사하여 사용할 수 있습니다.</p>
              <p>콘텐츠 사용 시 리뷰어와의 약관에 따라 출처를 명시해주세요.</p>
            </div>
          </div>
        </div>

        {/* 내보내기 확인 다이얼로그 */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>콘텐츠 내보내기</DialogTitle>
              <DialogDescription>
                선택한 {selectedIds.length}개의 콘텐츠를 내보내시겠습니까?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">내보내기 항목:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 리뷰어 이름</li>
                  <li>• 플랫폼</li>
                  <li>• 리뷰 URL</li>
                  <li>• 이미지 URL</li>
                  <li>• 등록일</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowExportDialog(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA]"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      내보내는 중...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      CSV 다운로드
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
