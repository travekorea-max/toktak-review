'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Users, FileText, AlertCircle, DollarSign, UserCheck } from 'lucide-react'

export default function AdminDashboard() {
  const supabase = createClient()

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    pendingCampaigns: 0,
    totalUsers: 0,
    totalReviewers: 0,
    totalClients: 0,
    pendingReviews: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status')

      const { data: users } = await supabase
        .from('users')
        .select('id, role')

      const { data: reviews } = await supabase
        .from('review_submissions')
        .select('id, status')

      setStats({
        totalCampaigns: campaigns?.length || 0,
        pendingCampaigns: campaigns?.filter(c => c.status === 'pending').length || 0,
        totalUsers: users?.length || 0,
        totalReviewers: users?.filter(u => u.role === 'reviewer').length || 0,
        totalClients: users?.filter(u => u.role === 'client').length || 0,
        pendingReviews: reviews?.filter(r => r.status === 'pending').length || 0,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            전체 시스템 현황을 확인하세요
          </p>
        </div>
        {stats.pendingCampaigns > 0 && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            승인대기 {stats.pendingCampaigns}건
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <Megaphone className="w-3 h-3" />
              전체 캠페인
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalCampaigns}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-yellow-600" />
              승인대기
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pendingCampaigns}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <Users className="w-3 h-3" />
              전체 회원
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-600" />
              리뷰어
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.totalReviewers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-600" />
              업체
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.totalClients}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <FileText className="w-3 h-3 text-purple-600" />
              검수대기
            </CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.pendingReviews}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>자주 사용하는 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/campaigns">
              <Button className="w-full justify-start" variant="outline">
                <Megaphone className="w-4 h-4 mr-2" />
                캠페인 승인 ({stats.pendingCampaigns}건 대기)
              </Button>
            </Link>
            <Link href="/admin/reviews">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                리뷰 검수 ({stats.pendingReviews}건 대기)
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                회원 관리
              </Button>
            </Link>
            <Link href="/admin/settlements">
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                정산 관리
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시스템 알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.pendingCampaigns > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                승인 대기 중인 캠페인이 {stats.pendingCampaigns}건 있습니다
              </div>
            )}
            {stats.pendingReviews > 0 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm">
                검수 대기 중인 리뷰가 {stats.pendingReviews}건 있습니다
              </div>
            )}
            {stats.pendingCampaigns === 0 && stats.pendingReviews === 0 && (
              <p className="text-sm text-gray-500">새로운 알림이 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
