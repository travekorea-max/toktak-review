'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Users, Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react'

export default function ClientDashboard() {
  const supabase = createClient()
  const { user } = useAuthStore()

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    pendingApplications: 0,
  })

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('client_id', user?.id)

      const campaignIds = campaigns?.map(c => c.id) || []
      const activeCampaigns = campaigns?.filter(c => ['recruiting', 'in_progress'].includes(c.status)).length || 0

      const { data: applications } = await supabase
        .from('applications')
        .select('id, status')
        .in('campaign_id', campaignIds)

      setStats({
        totalCampaigns: campaigns?.length || 0,
        activeCampaigns,
        totalApplications: applications?.length || 0,
        pendingApplications: applications?.filter(a => a.status === 'applied').length || 0,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          캠페인 현황을 한눈에 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              전체 캠페인
            </CardDescription>
            <CardTitle className="text-4xl">{stats.totalCampaigns}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              진행 중
            </CardDescription>
            <CardTitle className="text-4xl text-green-600">{stats.activeCampaigns}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              전체 지원자
            </CardDescription>
            <CardTitle className="text-4xl text-blue-600">{stats.totalApplications}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              검토 대기
            </CardDescription>
            <CardTitle className="text-4xl text-yellow-600">{stats.pendingApplications}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>빠른 시작</CardTitle>
            <CardDescription>자주 사용하는 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/campaigns/new">
              <Button className="w-full justify-start" variant="outline">
                <Megaphone className="w-4 h-4 mr-2" />
                새 캠페인 등록
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                캠페인 관리
              </Button>
            </Link>
            <Link href="/settlements">
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                정산 내역
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>공지사항</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">새로운 공지사항이 없습니다</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
