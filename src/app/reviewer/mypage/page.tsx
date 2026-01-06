'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  User,
  Settings,
  CreditCard,
  Star,
  Wallet,
  FileText,
  ChevronRight,
  ArrowRight,
  Gift,
  TrendingUp,
  Clock
} from 'lucide-react'

export default function MyPageIndex() {
  const supabase = createClient()
  const { user, reviewerProfile } = useAuthStore()
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [activityStats, setActivityStats] = useState({
    total: 0,
    pending: 0,
    selected: 0,
  })

  useEffect(() => {
    if (user) {
      fetchRecentActivities()
    }
  }, [user])

  const fetchRecentActivities = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          campaigns (title, product_name)
        `)
        .eq('reviewer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3)

      setRecentActivities(data || [])

      // Get stats
      const { data: allApps } = await supabase
        .from('applications')
        .select('status')
        .eq('reviewer_id', user?.id)

      if (allApps) {
        setActivityStats({
          total: allApps.length,
          pending: allApps.filter(a => a.status === 'applied').length,
          selected: allApps.filter(a => a.status === 'selected').length,
        })
      }
    } catch (err) {
      console.error('Error fetching activities:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      applied: { label: '검토대기', bg: 'bg-amber-50', text: 'text-amber-600' },
      selected: { label: '선정', bg: 'bg-emerald-50', text: 'text-emerald-600' },
      rejected: { label: '미선정', bg: 'bg-gray-100', text: 'text-gray-500' },
      cancelled: { label: '취소', bg: 'bg-red-50', text: 'text-red-600' },
    }
    const c = config[status] || config.applied
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#EEF2FF] rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-[#4F46E5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {reviewerProfile?.name || '리뷰어'}님
              </h1>
              <p className="text-sm text-gray-500">리뷰어 회원</p>
            </div>
          </div>
          <Link href="/reviewer/mypage/profile">
            <Button variant="outline" size="sm" className="h-9">
              <Settings className="w-4 h-4 mr-1.5" />
              프로필 수정
            </Button>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reviewerProfile?.rating?.toFixed(1) || '0.0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">평점</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#4F46E5]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reviewerProfile?.review_count || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">작성 리뷰</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {(reviewerProfile?.point_balance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">보유 포인트</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{activityStats.selected}</p>
            <p className="text-xs text-gray-500 mt-1">선정 캠페인</p>
          </div>
        </div>

        {/* 포인트 출금 배너 */}
        {(reviewerProfile?.point_balance || 0) >= 10000 && (
          <Link href="/reviewer/points/withdraw">
            <div className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-xl p-5 mb-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">포인트 출금 가능</p>
                  <p className="text-sm text-white/80">
                    {(reviewerProfile?.point_balance || 0).toLocaleString()}P 보유 중
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 최근 활동 */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">최근 활동</h2>
                {activityStats.pending > 0 && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    대기 {activityStats.pending}
                  </span>
                )}
              </div>
              <Link href="/reviewer/my-activities" className="text-sm text-[#4F46E5] hover:underline flex items-center gap-1">
                전체보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/reviewer/my-activities/${activity.id}`}
                    className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {activity.campaigns?.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {activity.campaigns?.product_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(activity.status)}
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">아직 신청한 캠페인이 없습니다</p>
                  <Link href="/reviewer/campaigns">
                    <Button variant="outline" size="sm">
                      캠페인 둘러보기
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 사이드 메뉴 */}
          <div className="space-y-4">
            {/* 빠른 메뉴 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">빠른 메뉴</h2>
              <div className="space-y-2">
                <Link href="/reviewer/campaigns">
                  <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <Gift className="w-4 h-4 mr-3 text-gray-400" />
                    캠페인 찾기
                  </Button>
                </Link>
                <Link href="/reviewer/my-activities">
                  <Button variant="ghost" className="w-full justify-between h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-3 text-gray-400" />
                      내 활동
                    </span>
                    {activityStats.pending > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                        {activityStats.pending}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/reviewer/points">
                  <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <Wallet className="w-4 h-4 mr-3 text-gray-400" />
                    포인트 내역
                  </Button>
                </Link>
              </div>
            </div>

            {/* 설정 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">설정</h2>
              <div className="space-y-2">
                <Link href="/reviewer/mypage/profile">
                  <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    프로필 관리
                  </Button>
                </Link>
                <Link href="/reviewer/mypage/account">
                  <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                    계좌 정보
                  </Button>
                </Link>
                <Link href="/reviewer/mypage/settings">
                  <Button variant="ghost" className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <Settings className="w-4 h-4 mr-3 text-gray-400" />
                    알림 설정
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
