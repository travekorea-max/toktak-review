'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, SlidersHorizontal, Package } from 'lucide-react'
import { CampaignCard, CampaignCardSkeleton } from '@/components/campaigns/CampaignCard'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

const categories = [
  { id: 'all', label: '전체' },
  { id: 'hot', label: '마감임박' },
  { id: 'naver', label: '네이버' },
  { id: 'coupang', label: '쿠팡' },
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

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-20">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">캠페인</h1>
              <p className="text-sm text-gray-500 mt-1">
                무료로 제품을 체험하고 포인트를 받으세요
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-[200px] h-9 bg-gray-50 border-gray-200 text-sm"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px] h-9 bg-gray-50 border-gray-200 text-sm">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="deadline">마감임박순</SelectItem>
                  <SelectItem value="reward">포인트순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-2 mt-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label}
                {category.id === 'hot' && hotCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">
                    {hotCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            총 <span className="font-medium text-gray-900">{filteredCampaigns.length}</span>개
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">캠페인이 없습니다</h3>
            <p className="text-sm text-gray-500 text-center">
              {searchQuery
                ? '검색 결과가 없습니다'
                : '현재 모집 중인 캠페인이 없습니다'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
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
