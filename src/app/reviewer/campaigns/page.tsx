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
  TrendingUp,
  Sparkles,
  Gift,
  Star,
  ChevronRight,
  Zap
} from 'lucide-react'
import { CampaignCard, CampaignCardSkeleton } from '@/components/campaigns/CampaignCard'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

const categories = [
  { id: 'all', label: '전체', icon: Package },
  { id: 'hot', label: '마감임박', icon: Flame },
  { id: 'naver', label: '네이버', icon: null, color: 'text-[#03C75A]' },
  { id: 'coupang', label: '쿠팡', icon: null, color: 'text-[#E52E26]' },
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
    <div className="min-h-screen bg-gradient-to-b from-[#FAFBFC] to-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF2FF] rounded-full text-[#4F46E5] text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            무료 체험단
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">캠페인</h1>
          <p className="text-gray-500 mt-2">
            무료로 제품을 체험하고 리뷰 포인트를 받으세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-[#4F46E5]/20 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500 font-medium">전체 캠페인</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-[#03C75A]/20 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#03C75A]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-sm font-bold text-[#03C75A]">N</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">네이버</span>
            </div>
            <p className="text-3xl font-bold text-[#03C75A]">{stats.naver}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-[#E52E26]/20 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#E52E26]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-sm font-bold text-[#E52E26]">C</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">쿠팡</span>
            </div>
            <p className="text-3xl font-bold text-[#E52E26]">{stats.coupang}</p>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* 검색 */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="캠페인 또는 제품명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-gray-50 border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
              />
            </div>

            {/* 정렬 */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[160px] h-12 bg-gray-50 border-gray-200 rounded-xl">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#4F46E5]" />
                    최신순
                  </span>
                </SelectItem>
                <SelectItem value="deadline">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    마감임박순
                  </span>
                </SelectItem>
                <SelectItem value="reward">
                  <span className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-500" />
                    포인트순
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100 overflow-x-auto">
            {categories.map((category) => {
              const Icon = category.icon
              const isActive = activeCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${isActive ? '' : category.id === 'hot' ? 'text-red-500' : ''}`} />}
                  {category.id === 'naver' && !isActive && <span className="w-2 h-2 bg-[#03C75A] rounded-full" />}
                  {category.id === 'coupang' && !isActive && <span className="w-2 h-2 bg-[#E52E26] rounded-full" />}
                  {category.label}
                  {category.id === 'hot' && hotCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive
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
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            총 <span className="font-bold text-[#4F46E5]">{filteredCampaigns.length}</span>개의 캠페인
          </p>
        </div>

        {/* 캠페인 목록 */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">캠페인이 없습니다</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? '검색 결과가 없습니다. 다른 키워드로 검색해보세요.'
                : '현재 모집 중인 캠페인이 없습니다.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="rounded-xl"
              >
                검색 초기화
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
