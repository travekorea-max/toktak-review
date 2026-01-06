'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row'] & {
  campaigns?: Database['public']['Tables']['campaigns']['Row']
}

const statusLabels = {
  applied: '검토대기',
  selected: '선정',
  rejected: '미선정',
  cancelled: '취소',
}

const statusIcons = {
  applied: Clock,
  selected: CheckCircle,
  rejected: AlertCircle,
  cancelled: AlertCircle,
}

export default function MyActivitiesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()

  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          campaigns (*)
        `)
        .eq('reviewer_id', user?.id)
        .order('created_at', { ascending: false })

      setApplications(data || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredApplications = () => {
    if (activeTab === 'all') return applications
    return applications.filter(app => app.status === activeTab)
  }

  const filteredApplications = getFilteredApplications()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">내 활동</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          신청한 캠페인과 진행 상황을 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>전체 신청</CardDescription>
            <CardTitle className="text-3xl">{applications.length}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>검토 대기</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {applications.filter(a => a.status === 'applied').length}건
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>선정</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {applications.filter(a => a.status === 'selected').length}건
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>미선정</CardDescription>
            <CardTitle className="text-3xl text-gray-600">
              {applications.filter(a => a.status === 'rejected').length}건
            </CardTitle>
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

        <TabsContent value={activeTab} className="space-y-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>신청 내역이 없습니다</p>
                  <Link href="/reviewer/campaigns">
                    <Button className="mt-4">캠페인 둘러보기</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApplications.map((app) => {
                const campaign = app.campaigns
                if (!campaign) return null

                const StatusIcon = statusIcons[app.status]

                return (
                  <Card key={app.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
                        <Badge
                          variant={app.status === 'selected' ? 'default' : 'outline'}
                          className={
                            app.status === 'applied'
                              ? 'bg-yellow-50 text-yellow-700'
                              : app.status === 'selected'
                              ? 'bg-green-500'
                              : 'bg-gray-50'
                          }
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusLabels[app.status]}
                        </Badge>
                      </div>
                      <CardDescription>{campaign.product_name}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">플랫폼</span>
                        <span className="font-medium">
                          {app.platform === 'naver' ? '네이버' : '쿠팡'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">리뷰 포인트</span>
                        <span className="font-medium">
                          {app.platform === 'naver'
                            ? campaign.review_fee_naver.toLocaleString()
                            : campaign.review_fee_coupang.toLocaleString()
                          }원
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">신청일</span>
                        <span className="font-medium">
                          {new Date(app.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>

                      {app.status === 'selected' && app.selected_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">선정일</span>
                          <span className="font-medium">
                            {new Date(app.selected_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      )}

                      {app.status === 'selected' && (
                        <Alert>
                          <AlertDescription className="text-sm">
                            구매 인증 및 리뷰 작성을 진행해주세요
                          </AlertDescription>
                        </Alert>
                      )}

                      <Link href={`/reviewer/my-activities/${app.id}`}>
                        <Button className="w-full mt-2" variant="outline">
                          상세보기
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
