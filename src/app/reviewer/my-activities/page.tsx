'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  Package,
  ChevronRight
} from 'lucide-react'
import { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row'] & {
  campaigns?: Database['public']['Tables']['campaigns']['Row']
}

const tabs = [
  { id: 'all', label: '전체' },
  { id: 'applied', label: '검토대기' },
  { id: 'selected', label: '선정' },
  { id: 'rejected', label: '미선정' },
]

export default function MyActivitiesPage() {
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; text: string; icon: any }> = {
      applied: { label: '검토대기', bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
      selected: { label: '선정', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle },
      rejected: { label: '미선정', bg: 'bg-gray-100', text: 'text-gray-500', icon: AlertCircle },
      cancelled: { label: '취소', bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle },
    }
    const c = config[status] || config.applied
    const Icon = c.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    )
  }

  const filteredApplications = getFilteredApplications()
  const counts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    selected: applications.filter(a => a.status === 'selected').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">내 활동</h1>
          <p className="text-sm text-gray-500 mt-1">
            신청한 캠페인과 진행 상황을 확인하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">전체 신청</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm text-gray-500">검토 대기</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{counts.applied}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">선정</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{counts.selected}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500">미선정</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{counts.rejected}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${activeTab === tab.id ? 'text-white/80' : 'text-gray-400'}`}>
                {counts[tab.id as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* 목록 */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">신청 내역이 없습니다</h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeTab === 'all'
                ? '캠페인에 신청해보세요'
                : `${tabs.find(t => t.id === activeTab)?.label} 상태인 캠페인이 없습니다`}
            </p>
            <Link href="/reviewer/campaigns">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA]">
                캠페인 둘러보기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => {
              const campaign = app.campaigns
              if (!campaign) return null

              return (
                <Link
                  key={app.id}
                  href={`/reviewer/my-activities/${app.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(app.status)}
                        {app.status === 'selected' && (
                          <span className="text-xs text-emerald-600 font-medium">
                            구매 인증 필요
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 truncate mb-1">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-gray-500">{campaign.product_name}</p>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-gray-500">
                          플랫폼:{' '}
                          <span className="text-gray-900 font-medium">
                            {app.platform === 'naver' ? '네이버' : '쿠팡'}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          포인트:{' '}
                          <span className="text-[#4F46E5] font-medium">
                            {(app.platform === 'naver'
                              ? campaign.review_fee_naver
                              : campaign.review_fee_coupang
                            ).toLocaleString()}P
                          </span>
                        </span>
                        <span className="text-gray-500">
                          신청일:{' '}
                          <span className="text-gray-900">
                            {new Date(app.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
