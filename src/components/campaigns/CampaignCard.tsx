'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react'
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
  draft: 'bg-gray-500',
  pending: 'bg-yellow-500',
  recruiting: 'bg-green-500',
  closed: 'bg-orange-500',
  in_progress: 'bg-blue-500',
  reviewing: 'bg-purple-500',
  completed: 'bg-gray-700',
  cancelled: 'bg-red-500',
}

const platformLabels = {
  naver: '네이버',
  coupang: '쿠팡',
  both: '네이버+쿠팡',
}

export function CampaignCard({ campaign, viewMode = 'reviewer' }: CampaignCardProps) {
  const totalRecruitCount = campaign.recruit_count_naver + campaign.recruit_count_coupang
  const baseUrl = viewMode === 'reviewer' ? '/campaigns' : viewMode === 'client' ? '/campaigns' : '/campaigns'

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{campaign.title}</CardTitle>
            <CardDescription className="mt-1">{campaign.product_name}</CardDescription>
          </div>
          <Badge className={statusColors[campaign.status]}>
            {statusLabels[campaign.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>{platformLabels[campaign.platform]}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>모집인원: {totalRecruitCount}명</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <DollarSign className="w-4 h-4" />
          <span>
            {campaign.platform === 'both'
              ? `네이버 ${campaign.review_fee_naver.toLocaleString()}원 / 쿠팡 ${campaign.review_fee_coupang.toLocaleString()}원`
              : campaign.platform === 'naver'
              ? `${campaign.review_fee_naver.toLocaleString()}원`
              : `${campaign.review_fee_coupang.toLocaleString()}원`
            }
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(campaign.recruit_end_date).toLocaleDateString('ko-KR')} 마감
          </span>
        </div>

        {campaign.product_description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {campaign.product_description}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Link href={`${baseUrl}/${campaign.id}`} className="w-full">
          <Button className="w-full" variant={viewMode === 'reviewer' ? 'default' : 'outline'}>
            {viewMode === 'reviewer' && '상세보기'}
            {viewMode === 'client' && '캠페인 관리'}
            {viewMode === 'admin' && '상세보기'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
