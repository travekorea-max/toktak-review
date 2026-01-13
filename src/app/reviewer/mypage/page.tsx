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
  Clock,
  Sparkles,
  Crown
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
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  const getLevelInfo = () => {
    const reviewCount = reviewerProfile?.review_count || 0
    if (reviewCount >= 50) return { level: 'Master', color: 'from-amber-400 to-amber-600', icon: Crown }
    if (reviewCount >= 20) return { level: 'Expert', color: 'from-purple-500 to-purple-700', icon: Star }
    if (reviewCount >= 5) return { level: 'Active', color: 'from-blue-500 to-blue-700', icon: TrendingUp }
    return { level: 'Starter', color: 'from-gray-400 to-gray-600', icon: User }
  }

  const levelInfo = getLevelInfo()
  const LevelIcon = levelInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-[#FAFBFC] to-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 프로필 헤더 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/30 p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#4F46E5]/5 to-[#7C3AED]/5 rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl flex items-center justify-center shadow-lg shadow-[#4F46E5]/25">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br ${levelInfo.color} rounded-lg flex items-center justify-center shadow-md`}>
                  <LevelIcon className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">
                    {reviewerProfile?.name || '리뷰어'}님
                  </h1>
                  <span className={`px-2 py-0.5 bg-gradient-to-r ${levelInfo.color} text-white text-xs font-medium rounded-full`}>
                    {levelInfo.level}
                  </span>
                </div>
                <p className="text-sm text-gray-500">리뷰어 회원</p>
              </div>
            </div>
            <Link href="/reviewer/mypage/profile">
              <Button variant="outline" size="sm" className="h-10 rounded-xl border-gray-200 hover:bg-gray-50">
                <Settings className="w-4 h-4 mr-2" />
                프로필 수정
              </Button>
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg shadow-amber-100/30 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200/50">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reviewerProfile?.rating?.toFixed(1) || '0.0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">평점</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg shadow-[#4F46E5]/10 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#4F46E5]/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reviewerProfile?.review_count || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">작성 리뷰</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg shadow-emerald-100/30 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              {(reviewerProfile?.point_balance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">보유 포인트</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg shadow-blue-100/30 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{activityStats.selected}</p>
            <p className="text-xs text-gray-500 mt-1">선정 캠페인</p>
          </div>
        </div>

        {/* 포인트 출금 배너 */}
        {(reviewerProfile?.point_balance || 0) >= 10000 && (
          <Link href="/reviewer/points/withdraw">
            <div className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-2xl p-6 mb-6 flex items-center justify-between text-white shadow-xl shadow-[#4F46E5]/25 hover:shadow-2xl hover:shadow-[#4F46E5]/30 transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-4 relative">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">포인트 출금 가능</p>
                  <p className="text-sm text-white/80">
                    {(reviewerProfile?.point_balance || 0).toLocaleString()}P 보유 중
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 relative" />
            </div>
          </Link>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 최근 활동 */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <h2 className="font-bold text-gray-900">최근 활동</h2>
                {activityStats.pending > 0 && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full animate-pulse">
                    대기 {activityStats.pending}
                  </span>
                )}
              </div>
              <Link href="/reviewer/my-activities" className="text-sm text-[#4F46E5] hover:underline flex items-center gap-1 font-medium">
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
                    className="flex items-center justify-between p-5 hover:bg-[#4F46E5]/5 transition-colors"
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
                <div className="p-10 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">아직 신청한 캠페인이 없습니다</p>
                  <Link href="/reviewer/campaigns">
                    <Button className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] rounded-xl shadow-lg shadow-[#4F46E5]/25">
                      <Sparkles className="w-4 h-4 mr-2" />
                      캠페인 둘러보기
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 사이드 메뉴 */}
          <div className="space-y-5">
            {/* 빠른 메뉴 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                빠른 메뉴
              </h2>
              <div className="space-y-2">
                <Link href="/reviewer/campaigns">
                  <Button variant="ghost" className="w-full justify-start h-11 text-gray-600 hover:text-[#4F46E5] hover:bg-[#4F46E5]/5 rounded-xl">
                    <Gift className="w-4 h-4 mr-3" />
                    캠페인 찾기
                  </Button>
                </Link>
                <Link href="/reviewer/my-activities">
                  <Button variant="ghost" className="w-full justify-between h-11 text-gray-600 hover:text-[#4F46E5] hover:bg-[#4F46E5]/5 rounded-xl">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-3" />
                      내 활동
                    </span>
                    {activityStats.pending > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        {activityStats.pending}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/reviewer/points">
                  <Button variant="ghost" className="w-full justify-start h-11 text-gray-600 hover:text-[#4F46E5] hover:bg-[#4F46E5]/5 rounded-xl">
                    <Wallet className="w-4 h-4 mr-3" />
                    포인트 내역
                  </Button>
                </Link>
              </div>
            </div>

            {/* 설정 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                설정
              </h2>
              <div className="space-y-2">
                <Link href="/reviewer/mypage/profile">
                  <Button variant="ghost" className="w-full justify-start h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl">
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    프로필 관리
                  </Button>
                </Link>
                <Link href="/reviewer/mypage/account">
                  <Button variant="ghost" className="w-full justify-start h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl">
                    <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                    계좌 정보
                  </Button>
                </Link>
                <Link href="/reviewer/mypage/settings">
                  <Button variant="ghost" className="w-full justify-start h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl">
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
