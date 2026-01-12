'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { CampaignFilters } from '@/components/campaigns/CampaignFilters'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Megaphone,
  Clock,
  PlayCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

const tabs = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '승인대기' },
  { id: 'active', label: '진행중' },
  { id: 'completed', label: '완료' },
]

export default function AdminCampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [platform, setPlatform] = useState('all')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [campaigns, searchQuery, platform, activeTab])

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 관리자는 모든 캠페인을 볼 수 있음
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCampaigns(data || [])
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      setError('캠페인을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...campaigns]

    // 탭별 필터
    if (activeTab !== 'all') {
      if (activeTab === 'pending') {
        filtered = filtered.filter((campaign) => campaign.status === 'pending')
      } else if (activeTab === 'active') {
        filtered = filtered.filter((campaign) =>
          ['recruiting', 'in_progress'].includes(campaign.status)
        )
      } else if (activeTab === 'completed') {
        filtered = filtered.filter((campaign) =>
          ['completed', 'cancelled'].includes(campaign.status)
        )
      }
    }

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          campaign.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 플랫폼 필터
    if (platform !== 'all') {
      filtered = filtered.filter((campaign) => campaign.platform === platform)
    }

    setFilteredCampaigns(filtered)
  }

  const handleReset = () => {
    setSearchQuery('')
    setPlatform('all')
  }

  const getCampaignCount = (tab: string) => {
    if (tab === 'all') return campaigns.length
    if (tab === 'pending') {
      return campaigns.filter((c) => c.status === 'pending').length
    }
    if (tab === 'active') {
      return campaigns.filter((c) =>
        ['recruiting', 'in_progress'].includes(c.status)
      ).length
    }
    if (tab === 'completed') {
      return campaigns.filter((c) =>
        ['completed', 'cancelled'].includes(c.status)
      ).length
    }
    return 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">캠페인 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              전체 캠페인을 관리하고 승인하세요
            </p>
          </div>
          {getCampaignCount('pending') > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-sm font-medium rounded-full border border-amber-200">
              승인대기 {getCampaignCount('pending')}
            </span>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">전체</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{getCampaignCount('all')}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm text-gray-500">승인대기</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{getCampaignCount('pending')}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">진행중</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{getCampaignCount('active')}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500">완료</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{getCampaignCount('completed')}</p>
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
                {getCampaignCount(tab.id)}
              </span>
            </button>
          ))}
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <CampaignFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            platform={platform}
            onPlatformChange={setPlatform}
            status=""
            onStatusChange={() => {}}
            onReset={handleReset}
            showStatus={false}
          />
        </div>

        {/* 에러 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 캠페인 목록 */}
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              {campaigns.length === 0 ? '등록된 캠페인이 없습니다' : '검색 결과가 없습니다'}
            </h3>
            <p className="text-sm text-gray-500">
              {campaigns.length === 0
                ? '업체가 캠페인을 등록하면 여기에 표시됩니다'
                : '다른 검색어나 필터를 시도해보세요'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} viewMode="admin" />
              ))}
            </div>

            <div className="text-center text-sm text-gray-500 mt-6">
              총 {filteredCampaigns.length}개의 캠페인
            </div>
          </>
        )}
      </div>
    </div>
  )
}
