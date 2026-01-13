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
  Bell,
  Sparkles,
  Building2,
  Rocket
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
      pending: { label: '승인대기', bg: 'bg-amber-100', text: 'text-amber-700' },
      recruiting: { label: '모집중', bg: 'bg-emerald-100', text: 'text-emerald-700' },
      in_progress: { label: '진행중', bg: 'bg-blue-100', text: 'text-blue-700' },
      completed: { label: '완료', bg: 'bg-gray-100', text: 'text-gray-600' },
      rejected: { label: '반려', bg: 'bg-red-100', text: 'text-red-700' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-100/50 to-gray-200/30 rounded-full blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-900/25">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
                <span className="px-2 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">Business</span>
              </div>
              <p className="text-sm text-gray-500">
                {clientProfile?.company_name || '업체'}님, 환영합니다
              </p>
            </div>
          </div>
          <Link href="/client/campaigns/new">
            <Button className="h-11 px-5 bg-gray-900 hover:bg-gray-800 rounded-xl shadow-lg shadow-gray-900/25">
              <Plus className="w-4 h-4 mr-2" />
              캠페인 등록
            </Button>
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-900/25">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">전체</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
          <p className="text-sm text-gray-500 mt-1">캠페인</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">활성</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{stats.activeCampaigns}</p>
          <p className="text-sm text-gray-500 mt-1">진행중</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">누적</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.totalApplications}</p>
          <p className="text-sm text-gray-500 mt-1">지원자</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-5 hover:shadow-xl transition-shadow relative">
          {stats.pendingApplications > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200/50">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">대기</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.pendingApplications}</p>
          <p className="text-sm text-gray-500 mt-1">검토 필요</p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 캠페인 */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Rocket className="w-4 h-4 text-gray-600" />
              </div>
              <h2 className="font-bold text-gray-900">최근 캠페인</h2>
            </div>
            <Link href="/client/campaigns" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium">
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
                    <p className="font-semibold text-gray-900 truncate">{campaign.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        {campaign.current_participants || 0}/{campaign.max_participants}명
                      </div>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-400">
                        {new Date(campaign.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(campaign.status)}
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">등록된 캠페인이 없습니다</h3>
                <p className="text-sm text-gray-500 mb-5">첫 번째 캠페인을 등록하고 리뷰어를 모집하세요</p>
                <Link href="/client/campaigns/new">
                  <Button className="bg-gray-900 hover:bg-gray-800 rounded-xl shadow-lg shadow-gray-900/25">
                    <Plus className="w-4 h-4 mr-2" />
                    첫 캠페인 등록하기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="space-y-5">
          {/* 빠른 시작 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gray-400" />
              빠른 메뉴
            </h2>
            <div className="space-y-2">
              <Link href="/client/campaigns">
                <Button variant="ghost" className="w-full justify-start h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl">
                  <BarChart3 className="w-4 h-4 mr-3 text-gray-400" />
                  캠페인 관리
                </Button>
              </Link>
              <Link href="/client/settlements">
                <Button variant="ghost" className="w-full justify-start h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl">
                  <Wallet className="w-4 h-4 mr-3 text-gray-400" />
                  정산 내역
                </Button>
              </Link>
            </div>
          </div>

          {/* 알림 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-400" />
                알림
              </h2>
              {stats.pendingApplications > 0 && (
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </div>
            {stats.pendingApplications > 0 ? (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-medium">
                  검토 대기 중인 지원자가 <span className="font-bold">{stats.pendingApplications}명</span> 있습니다
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400">새로운 알림이 없습니다</p>
              </div>
            )}
          </div>

          {/* 도움말 */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <div className="relative">
              <h3 className="font-bold mb-2">도움이 필요하신가요?</h3>
              <p className="text-sm text-white/70 mb-4">
                캠페인 운영에 관한 가이드를 확인하세요
              </p>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 rounded-lg">
                가이드 보기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
