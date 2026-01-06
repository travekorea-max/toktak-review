'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, XCircle, Star } from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']
type Application = Database['public']['Tables']['applications']['Row'] & {
  reviewer_profiles?: {
    name: string
    phone: string
    rating: number
    review_count: number
    naver_id: string | null
    coupang_id: string | null
  }
}

export default function ApplicantsManagementPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const campaignId = params.id as string

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
      fetchApplications()
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      setCampaign(data)
    } catch (err) {
      console.error('Error fetching campaign:', err)
    }
  }

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          reviewer_profiles:reviewer_id (
            name,
            phone,
            rating,
            review_count,
            naver_id,
            coupang_id
          )
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      setApplications(data || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filtered = getFilteredApplications()
      setSelectedIds(filtered.map(app => app.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      alert('선택된 지원자가 없습니다')
      return
    }

    if (!confirm(`${selectedIds.length}명을 선정하시겠습니까?`)) {
      return
    }

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('applications')
        .update({
          status: 'selected',
          selected_at: new Date().toISOString(),
        })
        .in('id', selectedIds)

      if (error) throw error

      alert('선정이 완료되었습니다')
      setSelectedIds([])
      fetchApplications()
    } catch (err) {
      console.error('Error approving:', err)
      alert('선정 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      alert('선택된 지원자가 없습니다')
      return
    }

    if (!confirm(`${selectedIds.length}명을 미선정 처리하시겠습니까?`)) {
      return
    }

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .in('id', selectedIds)

      if (error) throw error

      alert('미선정 처리가 완료되었습니다')
      setSelectedIds([])
      fetchApplications()
    } catch (err) {
      console.error('Error rejecting:', err)
      alert('미선정 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleIndividualApprove = async (id: string) => {
    if (!confirm('이 지원자를 선정하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'selected',
          selected_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      alert('선정이 완료되었습니다')
      fetchApplications()
    } catch (err) {
      console.error('Error approving:', err)
      alert('선정 처리 중 오류가 발생했습니다')
    }
  }

  const handleIndividualReject = async (id: string) => {
    if (!confirm('이 지원자를 미선정 처리하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error

      alert('미선정 처리가 완료되었습니다')
      fetchApplications()
    } catch (err) {
      console.error('Error rejecting:', err)
      alert('미선정 처리 중 오류가 발생했습니다')
    }
  }

  const getFilteredApplications = () => {
    if (activeTab === 'all') return applications
    return applications.filter(app => app.status === activeTab)
  }

  const filteredApplications = getFilteredApplications()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">지원자 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {campaign?.title}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">전체 지원자</CardTitle>
            <p className="text-3xl font-bold">{applications.length}명</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">검토 대기</CardTitle>
            <p className="text-3xl font-bold text-yellow-600">
              {applications.filter(a => a.status === 'applied').length}명
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">선정</CardTitle>
            <p className="text-3xl font-bold text-green-600">
              {applications.filter(a => a.status === 'selected').length}명
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">미선정</CardTitle>
            <p className="text-3xl font-bold text-gray-600">
              {applications.filter(a => a.status === 'rejected').length}명
            </p>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            전체 ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="applied">
            검토대기 ({applications.filter(a => a.status === 'applied').length})
          </TabsTrigger>
          <TabsTrigger value="selected">
            선정 ({applications.filter(a => a.status === 'selected').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            미선정 ({applications.filter(a => a.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {selectedIds.length > 0 && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedIds.length}명 선택됨</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    선정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkReject}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    미선정
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredApplications.length && filteredApplications.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>플랫폼</TableHead>
                    <TableHead>평점</TableHead>
                    <TableHead>리뷰수</TableHead>
                    <TableHead>신청일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        지원자가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(app.id)}
                            onCheckedChange={(checked) => handleSelect(app.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.reviewer_profiles?.name || '알 수 없음'}</p>
                            <p className="text-sm text-gray-500">{app.reviewer_profiles?.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {app.platform === 'naver' ? '네이버' : '쿠팡'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>{app.reviewer_profiles?.rating.toFixed(1) || '0.0'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{app.reviewer_profiles?.review_count || 0}건</TableCell>
                        <TableCell>
                          {new Date(app.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {app.status === 'applied' && (
                            <Badge variant="outline" className="bg-yellow-50">검토대기</Badge>
                          )}
                          {app.status === 'selected' && (
                            <Badge className="bg-green-500">선정</Badge>
                          )}
                          {app.status === 'rejected' && (
                            <Badge variant="outline">미선정</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {app.status === 'applied' && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleIndividualApprove(app.id)}
                              >
                                선정
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleIndividualReject(app.id)}
                              >
                                거부
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
    </div>
  )
}
