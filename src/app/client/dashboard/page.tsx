'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  Megaphone,
  Users,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  BarChart3,
  Wallet,
  ChevronRight,
  Bell
} from 'lucide-react'

export default function ClientDashboard() {
  const supabase = createClient()
  const { user, clientProfile } = useAuthStore()

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    pendingApplications: 0,
  })

  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchRecentCampaigns()
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
        .in('campaign_id', campaignIds.length > 0 ? campaignIds : ['00000000-0000-0000-0000-000000000000'])

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

  const fetchRecentCampaigns = async () => {
    try {
      const { data } = await supabase
        .from('campaigns')
        .select('id, title, status, current_participants, max_participants, created_at')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3)

      setRecentCampaigns(data || [])
    } catch (err) {
      console.error('Error fetching recent campaigns:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
      pending: { label: '승인대기', bg: 'bg-amber-50', text: 'text-amber-600' },
      recruiting: { label: '모집중', bg: 'bg-emerald-50', text: 'text-emerald-600' },
      in_progress: { label: '진행중', bg: 'bg-blue-50', text: 'text-blue-600' },
      completed: { label: '완료', bg: 'bg-gray-100', text: 'text-gray-600' },
      rejected: { label: '반려', bg: 'bg-red-50', text: 'text-red-600' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clientProfile?.company_name || '업체'}님, 환영합니다
          </p>
        </div>
        <Link href="/client/campaigns/new">
          <Button className="h-9 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            캠페인 등록
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[#4F46E5]" />
            </div>
            <span className="text-xs text-gray-400">전체</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
          <p className="text-xs text-gray-500 mt-1">캠페인</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs text-gray-400">활성</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.activeCampaigns}</p>
          <p className="text-xs text-gray-500 mt-1">진행중</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs text-gray-400">누적</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalApplications}</p>
          <p className="text-xs text-gray-500 mt-1">지원자</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs text-gray-400">대기</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingApplications}</p>
          <p className="text-xs text-gray-500 mt-1">검토 필요</p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 캠페인 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">최근 캠페인</h2>
            <Link href="/client/campaigns" className="text-sm text-[#4F46E5] hover:underline flex items-center gap-1">
              전체보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCampaigns.length > 0 ? (
              recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/client/campaigns/${campaign.id}`}
                  className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{campaign.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {campaign.current_participants || 0}/{campaign.max_participants}명 참여
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(campaign.status)}
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Megaphone className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">등록된 캠페인이 없습니다</p>
                <Link href="/client/campaigns/new">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    첫 캠페인 등록하기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="space-y-4">
          {/* 빠른 시작 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">빠른 메뉴</h2>
            <div className="space-y-2">
              <Link href="/client/campaigns">
                <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <BarChart3 className="w-4 h-4 mr-3 text-gray-400" />
                  캠페인 관리
                </Button>
              </Link>
              <Link href="/client/settlements">
                <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <Wallet className="w-4 h-4 mr-3 text-gray-400" />
                  정산 내역
                </Button>
              </Link>
            </div>
          </div>

          {/* 알림 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">알림</h2>
              <Bell className="w-4 h-4 text-gray-400" />
            </div>
            {stats.pendingApplications > 0 ? (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">
                  검토 대기 중인 지원자가 <span className="font-semibold">{stats.pendingApplications}명</span> 있습니다
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">새로운 알림이 없습니다</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
