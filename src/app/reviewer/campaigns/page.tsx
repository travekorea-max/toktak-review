'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Package,
  Flame,
  Filter,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react'
import { CampaignCard, CampaignCardSkeleton } from '@/components/campaigns/CampaignCard'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

const categories = [
  { id: 'all', label: '전체', icon: null },
  { id: 'hot', label: '마감임박', icon: Flame },
  { id: 'naver', label: '네이버', icon: null },
  { id: 'coupang', label: '쿠팡', icon: null },
]

export default function ReviewerCampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<string>('latest')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'recruiting')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredCampaigns = () => {
    let filtered = campaigns

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeCategory === 'naver') {
      filtered = filtered.filter(c => c.platform === 'naver' || c.platform === 'both')
    } else if (activeCategory === 'coupang') {
      filtered = filtered.filter(c => c.platform === 'coupang' || c.platform === 'both')
    } else if (activeCategory === 'hot') {
      filtered = filtered.filter(c => {
        const endDate = new Date(c.recruit_end_date)
        const today = new Date()
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysLeft <= 3 && daysLeft > 0
      })
    }

    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'deadline') {
      filtered.sort((a, b) => new Date(a.recruit_end_date).getTime() - new Date(b.recruit_end_date).getTime())
    } else if (sortBy === 'reward') {
      filtered.sort((a, b) => {
        const aFee = Math.max(a.review_fee_naver, a.review_fee_coupang)
        const bFee = Math.max(b.review_fee_naver, b.review_fee_coupang)
        return bFee - aFee
      })
    }

    return filtered
  }

  const filteredCampaigns = getFilteredCampaigns()
  const hotCount = campaigns.filter(c => {
    const endDate = new Date(c.recruit_end_date)
    const today = new Date()
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 3 && daysLeft > 0
  }).length

  const stats = {
    total: campaigns.length,
    naver: campaigns.filter(c => c.platform === 'naver' || c.platform === 'both').length,
    coupang: campaigns.filter(c => c.platform === 'coupang' || c.platform === 'both').length,
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">캠페인</h1>
          <p className="text-sm text-gray-500 mt-1">
            무료로 제품을 체험하고 포인트를 받으세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">전체 캠페인</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#03C75A]/10 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-[#03C75A]">N</span>
              </div>
              <span className="text-sm text-gray-500">네이버</span>
            </div>
            <p className="text-2xl font-bold text-[#03C75A]">{stats.naver}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#E53935]/10 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-[#E53935]">C</span>
              </div>
              <span className="text-sm text-gray-500">쿠팡</span>
            </div>
            <p className="text-2xl font-bold text-[#E53935]">{stats.coupang}</p>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* 검색 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="캠페인 또는 제품명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-gray-50 border-gray-200"
              />
            </div>

            {/* 정렬 */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[140px] h-10 bg-gray-50 border-gray-200">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    최신순
                  </span>
                </SelectItem>
                <SelectItem value="deadline">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    마감임박순
                  </span>
                </SelectItem>
                <SelectItem value="reward">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    포인트순
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {category.label}
                  {category.id === 'hot' && hotCount > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                      activeCategory === 'hot'
                        ? 'bg-white/20 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {hotCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 결과 수 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-900">{filteredCampaigns.length}</span>개의 캠페인
          </p>
        </div>

        {/* 캠페인 목록 */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">캠페인이 없습니다</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? '검색 결과가 없습니다. 다른 키워드로 검색해보세요.'
                : '현재 모집 중인 캠페인이 없습니다.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
              >
                검색 초기화
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                viewMode="reviewer"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
