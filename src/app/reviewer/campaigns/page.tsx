'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Users, Package, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Campaign {
  id: string
  title: string
  product_name: string
  product_description: string | null
  product_price: number
  product_images: string[] | null
  platform: 'naver' | 'coupang' | 'both'
  recruit_count_naver: number
  recruit_count_coupang: number
  review_fee_naver: number
  review_fee_coupang: number
  recruit_start_date: string
  recruit_end_date: string
  status: string
  application_count_naver?: number
  application_count_coupang?: number
}

export default function ReviewerCampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('latest')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)

      // 모집중인 캠페인만 가져오기
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'recruiting')
        .order('created_at', { ascending: false })

      if (error) throw error

      // 각 캠페인의 신청자 수 계산
      const campaignsWithCounts = await Promise.all(
        (data || []).map(async (campaign) => {
          const { count: naverCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('platform', 'naver')

          const { count: coupangCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('platform', 'coupang')

          return {
            ...campaign,
            application_count_naver: naverCount || 0,
            application_count_coupang: coupangCount || 0,
          }
        })
      )

      setCampaigns(campaignsWithCounts)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredCampaigns = () => {
    let filtered = campaigns

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 플랫폼 필터
    if (platformFilter !== 'all') {
      filtered = filtered.filter(c =>
        c.platform === platformFilter || c.platform === 'both'
      )
    }

    // 정렬
    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.recruit_start_date).getTime() - new Date(a.recruit_start_date).getTime())
    } else if (sortBy === 'deadline') {
      filtered.sort((a, b) => new Date(a.recruit_end_date).getTime() - new Date(b.recruit_end_date).getTime())
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => {
        const aTotal = (a.application_count_naver || 0) + (a.application_count_coupang || 0)
        const bTotal = (b.application_count_naver || 0) + (b.application_count_coupang || 0)
        return bTotal - aTotal
      })
    }

    return filtered
  }

  const filteredCampaigns = getFilteredCampaigns()

  const getPlatformBadge = (platform: string) => {
    if (platform === 'naver') return <Badge className="bg-green-500">네이버</Badge>
    if (platform === 'coupang') return <Badge className="bg-orange-500">쿠팡</Badge>
    return (
      <div className="flex gap-1">
        <Badge className="bg-green-500 text-xs">네이버</Badge>
        <Badge className="bg-orange-500 text-xs">쿠팡</Badge>
      </div>
    )
  }

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">캠페인을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">체험단 캠페인</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            무료로 제품을 체험하고 리뷰를 작성하면 포인트를 받으세요
          </p>
        </div>

        {/* 필터 & 검색 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="캠페인 또는 제품명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="플랫폼" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="naver">네이버</SelectItem>
              <SelectItem value="coupang">쿠팡</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="deadline">마감임박순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 캠페인 목록 */}
      {filteredCampaigns.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>진행 중인 캠페인이 없습니다</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const daysLeft = getDaysLeft(campaign.recruit_end_date)
            const thumbnailImage = campaign.product_images?.[0] || '/placeholder-product.png'

            return (
              <Link key={campaign.id} href={`/reviewer/campaigns/${campaign.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group">
                  {/* 이미지 */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={thumbnailImage}
                      alt={campaign.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'
                      }}
                    />

                    {/* 마감 임박 배지 */}
                    {daysLeft <= 3 && daysLeft > 0 && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-red-500 text-white">
                          마감 {daysLeft}일 전
                        </Badge>
                      </div>
                    )}

                    {/* 플랫폼 배지 */}
                    <div className="absolute top-3 right-3">
                      {getPlatformBadge(campaign.platform)}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* 제목 */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {campaign.title}
                    </h3>

                    {/* 제품명 */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {campaign.product_name}
                    </p>

                    {/* 가격 */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        {campaign.product_price.toLocaleString()}원
                      </span>
                      <span className="text-sm text-gray-500">상당</span>
                    </div>

                    {/* 리뷰 포인트 */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">리뷰 작성 시</span>
                        <span className="font-bold text-yellow-700 dark:text-yellow-500">
                          {campaign.platform === 'both'
                            ? `${Math.max(campaign.review_fee_naver, campaign.review_fee_coupang).toLocaleString()}P`
                            : campaign.platform === 'naver'
                            ? `${campaign.review_fee_naver.toLocaleString()}P`
                            : `${campaign.review_fee_coupang.toLocaleString()}P`
                          }
                        </span>
                      </div>
                    </div>

                    {/* 신청 현황 */}
                    <div className="space-y-2">
                      {(campaign.platform === 'naver' || campaign.platform === 'both') && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            네이버
                          </span>
                          <span className="font-medium">
                            <span className="text-blue-600">{campaign.application_count_naver || 0}</span>
                            <span className="text-gray-400"> / {campaign.recruit_count_naver}명</span>
                          </span>
                        </div>
                      )}

                      {(campaign.platform === 'coupang' || campaign.platform === 'both') && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            쿠팡
                          </span>
                          <span className="font-medium">
                            <span className="text-blue-600">{campaign.application_count_coupang || 0}</span>
                            <span className="text-gray-400"> / {campaign.recruit_count_coupang}명</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <div className="w-full flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(campaign.recruit_end_date), 'MM/dd까지', { locale: ko })}
                      </div>
                      <Button size="sm" className="h-8">
                        신청하기
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
