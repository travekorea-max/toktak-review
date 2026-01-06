'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { Database } from '@/types/database'

type ReviewSubmission = Database['public']['Tables']['review_submissions']['Row']

export default function ReviewsManagementPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<ReviewSubmission[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedReview, setSelectedReview] = useState<ReviewSubmission | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from('review_submissions')
        .select('*')
        .order('created_at', { ascending: false })

      setReviews(data || [])
    } catch (err) {
      console.error('Error fetching reviews:', err)
    }
  }

  const handleApprove = async (review: ReviewSubmission) => {
    if (!confirm('이 리뷰를 승인하시겠습니까?')) return

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('review_submissions')
        .update({
          status: 'approved',
          checked_at: new Date().toISOString(),
        })
        .eq('id', review.id)

      if (error) throw error

      alert('리뷰가 승인되었습니다')
      fetchReviews()
    } catch (err) {
      console.error('Error approving review:', err)
      alert('리뷰 승인 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!selectedReview || !rejectComment.trim()) {
      alert('반려 사유를 입력해주세요')
      return
    }

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('review_submissions')
        .update({
          status: 'revision_requested',
          revision_comment: rejectComment,
          checked_at: new Date().toISOString(),
        })
        .eq('id', selectedReview.id)

      if (error) throw error

      alert('리뷰 수정이 요청되었습니다')
      setShowRejectDialog(false)
      setRejectComment('')
      setSelectedReview(null)
      fetchReviews()
    } catch (err) {
      console.error('Error rejecting review:', err)
      alert('리뷰 반려 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const getFilteredReviews = () => {
    if (activeTab === 'all') return reviews
    return reviews.filter(r => r.status === activeTab)
  }

  const filteredReviews = getFilteredReviews()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">리뷰 검수</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          제출된 리뷰를 검수하고 승인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">전체</CardTitle>
            <p className="text-3xl font-bold">{reviews.length}건</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">검수대기</CardTitle>
            <p className="text-3xl font-bold text-yellow-600">
              {reviews.filter(r => r.status === 'pending').length}건
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">승인</CardTitle>
            <p className="text-3xl font-bold text-green-600">
              {reviews.filter(r => r.status === 'approved').length}건
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">수정요청</CardTitle>
            <p className="text-3xl font-bold text-red-600">
              {reviews.filter(r => r.status === 'revision_requested').length}건
            </p>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            검수대기 ({reviews.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            승인 ({reviews.filter(r => r.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="revision_requested">
            수정요청 ({reviews.filter(r => r.status === 'revision_requested').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            전체 ({reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제출일</TableHead>
                    <TableHead>플랫폼</TableHead>
                    <TableHead>리뷰 URL</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        검수할 리뷰가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          {new Date(review.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {review.platform === 'naver' ? '네이버' : '쿠팡'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a
                            href={review.review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            리뷰 보기
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          {review.status === 'pending' && (
                            <Badge variant="outline" className="bg-yellow-50">검수대기</Badge>
                          )}
                          {review.status === 'approved' && (
                            <Badge className="bg-green-500">승인</Badge>
                          )}
                          {review.status === 'revision_requested' && (
                            <Badge variant="outline" className="text-red-600">수정요청</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {review.status === 'pending' && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(review)}
                                disabled={isProcessing}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReview(review)
                                  setShowRejectDialog(true)
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                반려
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>리뷰 반려</DialogTitle>
            <DialogDescription>
              수정이 필요한 사유를 입력해주세요
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="comment">반려 사유 *</Label>
            <Textarea
              id="comment"
              placeholder="수정이 필요한 내용을 상세히 입력해주세요"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={isProcessing || !rejectComment.trim()}
            >
              {isProcessing ? '처리 중...' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
