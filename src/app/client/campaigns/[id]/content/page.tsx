'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Loader2,
  Package,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
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

      // 캠페인 정보 조회
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, title, product_name, platform, status')
        .eq('id', id)
        .eq('client_id', user?.id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // 승인된 리뷰 조회
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

      // 리뷰어 정보 조회
      const reviewerIds = [...new Set(applications.map(a => a.reviewer_id))]
      const { data: reviewerProfiles } = await supabase
        .from('reviewer_profiles')
        .select('user_id, name')
        .in('user_id', reviewerIds)

      const reviewerMap = new Map(
        reviewerProfiles?.map(r => [r.user_id, r.name]) || []
      )

      // 콘텐츠 사용 기록 조회
      const { data: usageRecords } = await supabase
        .from('content_usage')
        .select('review_id')
        .eq('campaign_id', id)

      const usedReviewIds = new Set(usageRecords?.map(u => u.review_id) || [])

      // 데이터 조합
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

      // CSV 생성
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

      // 사용 기록 저장
      for (const content of selectedContents) {
        await supabase.from('content_usage').upsert({
          campaign_id: id,
          review_id: content.id,
          used_at: new Date().toISOString(),
        }, {
          onConflict: 'campaign_id,review_id'
        })
      }

      // 상태 업데이트
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !campaign) {
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              2차 활용 콘텐츠
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{campaign.title}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowExportDialog(true)}
          disabled={selectedIds.length === 0}
        >
          <Package className="h-4 w-4 mr-2" />
          선택 콘텐츠 내보내기 ({selectedIds.length})
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>승인된 리뷰</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{approvedCount}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>2차 활용됨</CardDescription>
            <CardTitle className="text-3xl text-green-600">{usedCount}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>미사용</CardDescription>
            <CardTitle className="text-3xl text-gray-600">{approvedCount - usedCount}건</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 안내 */}
      <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-700 dark:text-purple-300">
              <p className="font-medium mb-1">2차 활용 콘텐츠란?</p>
              <p>리뷰어가 작성한 리뷰 콘텐츠(사진, 텍스트)를 광고, SNS, 상세페이지 등에 재사용할 수 있습니다.</p>
              <p className="mt-1">승인된 리뷰만 2차 활용이 가능하며, 콘텐츠 사용 시 출처를 명시해주세요.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 콘텐츠 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">콘텐츠 목록</CardTitle>
              <CardDescription>
                2차 활용 가능한 승인된 리뷰 콘텐츠입니다
              </CardDescription>
            </div>
            {contents.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedIds.length === contents.length ? '전체 해제' : '전체 선택'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">승인된 리뷰 콘텐츠가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">리뷰가 승인되면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contents.map((content) => (
                <div
                  key={content.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedIds.includes(content.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'hover:border-gray-300'
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
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden">
                      {content.image_url ? (
                        <img
                          src={content.image_url}
                          alt="리뷰 이미지"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* 콘텐츠 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{content.reviewer_name}</span>
                        <Badge variant="outline">
                          {platformLabels[content.platform as keyof typeof platformLabels]}
                        </Badge>
                        {content.is_used && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            활용됨
                          </Badge>
                        )}
                      </div>

                      {/* 리뷰 URL */}
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <a
                          href={content.review_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate max-w-md"
                        >
                          {content.review_url}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(content.review_url, `url-${content.id}`)}
                        >
                          {copiedId === `url-${content.id}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <a
                          href={content.review_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      </div>

                      {/* 이미지 URL */}
                      {content.image_url && (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500 truncate max-w-md">
                            {content.image_url}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(content.image_url, `img-${content.id}`)}
                          >
                            {copiedId === `img-${content.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <a
                            href={content.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Download className="h-3 w-3" />
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
        </CardContent>
      </Card>

      {/* 사용 안내 */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-500" />
            <div className="space-y-1">
              <p>• 콘텐츠를 선택하고 "내보내기"를 클릭하면 CSV 파일로 다운로드됩니다.</p>
              <p>• 리뷰 URL을 클릭하면 원본 리뷰 페이지로 이동합니다.</p>
              <p>• 이미지는 개별 다운로드하거나 URL을 복사하여 사용할 수 있습니다.</p>
              <p>• 콘텐츠 사용 시 리뷰어와의 약관에 따라 출처를 명시해주세요.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내보내기 확인 다이얼로그 */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>콘텐츠 내보내기</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.length}개의 콘텐츠를 내보내시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">내보내기 항목:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
                className="flex-1"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    내보내는 중...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    CSV 다운로드
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
