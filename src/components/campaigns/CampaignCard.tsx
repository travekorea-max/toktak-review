'use client'

import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

interface CampaignCardProps {
  campaign: Campaign
  viewMode?: 'reviewer' | 'client' | 'admin'
}

const statusLabels: Record<Campaign['status'], string> = {
  draft: '임시저장',
  pending: '승인대기',
  recruiting: '모집중',
  closed: '모집마감',
  in_progress: '진행중',
  reviewing: '검수중',
  completed: '완료',
  cancelled: '취소',
}

const statusColors: Record<Campaign['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-600',
  recruiting: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-orange-50 text-orange-600',
  in_progress: 'bg-blue-50 text-blue-600',
  reviewing: 'bg-purple-50 text-purple-600',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
}

const platformLabels = {
  naver: '네이버',
  coupang: '쿠팡',
  both: '네이버+쿠팡',
}

const sampleImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop',
]

export function CampaignCard({ campaign, viewMode = 'reviewer' }: CampaignCardProps) {
  const totalRecruitCount = campaign.recruit_count_naver + campaign.recruit_count_coupang
  const baseUrl = viewMode === 'reviewer'
    ? '/reviewer/campaigns'
    : viewMode === 'client'
    ? '/client/campaigns'
    : '/admin/campaigns'

  const endDate = new Date(campaign.recruit_end_date)
  const today = new Date()
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const reviewFee = campaign.platform === 'naver'
    ? campaign.review_fee_naver
    : campaign.platform === 'coupang'
    ? campaign.review_fee_coupang
    : Math.max(campaign.review_fee_naver, campaign.review_fee_coupang)

  const imageIndex = campaign.id.charCodeAt(0) % sampleImages.length
  const imageUrl = sampleImages[imageIndex]

  const progress = Math.floor(Math.random() * 60) + 30

  return (
    <Link href={`${baseUrl}/${campaign.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200">
        {/* 이미지 */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
          <img
            src={imageUrl}
            alt={campaign.product_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* 상단 뱃지 */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium text-gray-700">
              {platformLabels[campaign.platform]}
            </span>
            {campaign.status === 'recruiting' && daysLeft <= 3 && daysLeft > 0 && (
              <span className="px-2 py-1 bg-red-500 rounded text-xs font-medium text-white">
                마감임박
              </span>
            )}
            {campaign.status !== 'recruiting' && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[campaign.status]}`}>
                {statusLabels[campaign.status]}
              </span>
            )}
          </div>

          {/* 하단 남은 시간 */}
          {campaign.status === 'recruiting' && daysLeft > 0 && (
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-medium text-white">
                <Clock className="w-3 h-3" />
                {daysLeft}일 남음
              </span>
            </div>
          )}
        </div>

        {/* 컨텐츠 */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-[#4F46E5] transition-colors">
            {campaign.product_name}
          </h3>

          {/* 가격 & 포인트 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 line-through">
                {campaign.product_price.toLocaleString()}원
              </p>
              <p className="text-[#4F46E5] font-semibold">무료체험</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">리뷰 포인트</p>
              <p className="font-semibold text-emerald-600">+{reviewFee.toLocaleString()}P</p>
            </div>
          </div>

          {/* 모집 현황 */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                모집현황
              </span>
              <span>{Math.floor(totalRecruitCount * progress / 100)}/{totalRecruitCount}명</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F46E5] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function CampaignCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
      <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="flex justify-between pt-2">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full animate-pulse" />
      </div>
    </div>
  )
}
