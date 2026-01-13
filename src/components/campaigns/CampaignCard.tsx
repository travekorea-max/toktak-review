'use client'

import Link from 'next/link'
import { Clock, Users, Coins, Star, TrendingUp } from 'lucide-react'
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

const platformConfig = {
  naver: { label: '네이버', bg: 'bg-[#03C75A]', text: 'text-white' },
  coupang: { label: '쿠팡', bg: 'bg-[#E52E26]', text: 'text-white' },
  both: { label: 'N+C', bg: 'bg-gradient-to-r from-[#03C75A] to-[#E52E26]', text: 'text-white' },
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
  const imageUrl = campaign.product_images && campaign.product_images.length > 0
    ? campaign.product_images[0]
    : sampleImages[imageIndex]

  const progress = Math.floor(Math.random() * 60) + 30
  const platform = platformConfig[campaign.platform]
  const isHot = campaign.status === 'recruiting' && daysLeft <= 3 && daysLeft > 0

  return (
    <Link href={`${baseUrl}/${campaign.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#4F46E5]/30 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        {/* 이미지 */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={campaign.product_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* 오버레이 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* 상단 왼쪽 뱃지 */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${platform.bg} ${platform.text} shadow-lg`}>
              {platform.label}
            </span>
            {isHot && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg text-xs font-bold text-white shadow-lg flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                HOT
              </span>
            )}
          </div>

          {/* 상단 오른쪽 D-day */}
          {campaign.status === 'recruiting' && daysLeft > 0 && (
            <div className="absolute top-3 right-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg ${
                daysLeft <= 2
                  ? 'bg-red-500 text-white'
                  : 'bg-white/95 backdrop-blur-sm text-gray-700'
              }`}>
                D-{daysLeft}
              </span>
            </div>
          )}

          {/* 상태 뱃지 (모집중이 아닐 때) */}
          {campaign.status !== 'recruiting' && (
            <div className="absolute top-3 right-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColors[campaign.status]}`}>
                {statusLabels[campaign.status]}
              </span>
            </div>
          )}

          {/* 하단 모집 현황 바 */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">{Math.floor(totalRecruitCount * progress / 100)}명 신청</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{totalRecruitCount}명</span>
            </div>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 min-h-[2.5rem] text-sm group-hover:text-[#4F46E5] transition-colors">
            {campaign.product_name}
          </h3>

          {/* 가격 & 포인트 */}
          <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 line-through">
                {campaign.product_price.toLocaleString()}원
              </p>
              <p className="text-[#4F46E5] font-bold">무료체험</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
              <Coins className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-emerald-600">+{reviewFee.toLocaleString()}P</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function CampaignCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4" />
        <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/2" />
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <div className="h-5 bg-gray-100 rounded-lg animate-pulse w-1/4" />
          <div className="h-8 bg-emerald-50 rounded-lg animate-pulse w-1/3" />
        </div>
      </div>
    </div>
  )
}
