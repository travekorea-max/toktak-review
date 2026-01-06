'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Megaphone,
  Users,
  FileText,
  AlertCircle,
  Wallet,
  UserCheck,
  Building2,
  ChevronRight,
  ArrowRight,
  Bell,
  Shield
} from 'lucide-react'

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

  const [pendingItems, setPendingItems] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
    fetchPendingItems()
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

  const fetchPendingItems = async () => {
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, title, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      setPendingItems(campaigns || [])
    } catch (err) {
      console.error('Error fetching pending items:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-sm text-gray-500">시스템 현황을 확인하세요</p>
          </div>
        </div>
        {stats.pendingCampaigns > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-amber-700">
              승인대기 {stats.pendingCampaigns}건
            </span>
          </div>
        )}
      </div>

      {/* 통계 카드 - 상단 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[#4F46E5]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
          <p className="text-xs text-gray-500 mt-1">전체 캠페인</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            {stats.pendingCampaigns > 0 && (
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingCampaigns}</p>
          <p className="text-xs text-gray-500 mt-1">승인 대기</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            {stats.pendingReviews > 0 && (
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.pendingReviews}</p>
          <p className="text-xs text-gray-500 mt-1">검수 대기</p>
        </div>
      </div>

      {/* 통계 카드 - 회원 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-sm text-gray-500">전체 회원</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm text-gray-500">리뷰어</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalReviewers}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm text-gray-500">광고주</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.totalClients}</p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 승인 대기 목록 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">승인 대기 캠페인</h2>
              {stats.pendingCampaigns > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  {stats.pendingCampaigns}
                </span>
              )}
            </div>
            <Link href="/admin/campaigns" className="text-sm text-[#4F46E5] hover:underline flex items-center gap-1">
              전체보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingItems.length > 0 ? (
              pendingItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/campaigns/${item.id}`}
                  className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString('ko-KR')} 등록
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                      승인대기
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm text-gray-500">승인 대기 중인 캠페인이 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 빠른 작업 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">빠른 작업</h2>
            <div className="space-y-2">
              <Link href="/admin/campaigns">
                <Button variant="ghost" className="w-full justify-between h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <span className="flex items-center">
                    <Megaphone className="w-4 h-4 mr-3 text-gray-400" />
                    캠페인 승인
                  </span>
                  {stats.pendingCampaigns > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                      {stats.pendingCampaigns}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/admin/reviews">
                <Button variant="ghost" className="w-full justify-between h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-3 text-gray-400" />
                    리뷰 검수
                  </span>
                  {stats.pendingReviews > 0 && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      {stats.pendingReviews}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <Users className="w-4 h-4 mr-3 text-gray-400" />
                  회원 관리
                </Button>
              </Link>
              <Link href="/admin/settlements">
                <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <Wallet className="w-4 h-4 mr-3 text-gray-400" />
                  정산 관리
                </Button>
              </Link>
            </div>
          </div>

          {/* 시스템 알림 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">시스템 알림</h2>
              <Bell className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              {stats.pendingCampaigns > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700">
                    승인 대기 캠페인 <span className="font-semibold">{stats.pendingCampaigns}건</span>
                  </p>
                </div>
              )}
              {stats.pendingReviews > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    검수 대기 리뷰 <span className="font-semibold">{stats.pendingReviews}건</span>
                  </p>
                </div>
              )}
              {stats.pendingCampaigns === 0 && stats.pendingReviews === 0 && (
                <p className="text-sm text-gray-400">새로운 알림이 없습니다</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
