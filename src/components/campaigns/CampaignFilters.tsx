'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface CampaignFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  platform: string
  onPlatformChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  onReset: () => void
  showStatus?: boolean
}

export function CampaignFilters({
  searchQuery,
  onSearchChange,
  platform,
  onPlatformChange,
  status,
  onStatusChange,
  onReset,
  showStatus = true,
}: CampaignFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">검색</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="search"
              placeholder="캠페인명, 제품명 검색"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform">플랫폼</Label>
          <Select value={platform} onValueChange={onPlatformChange}>
            <SelectTrigger id="platform">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="naver">네이버</SelectItem>
              <SelectItem value="coupang">쿠팡</SelectItem>
              <SelectItem value="both">네이버+쿠팡</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showStatus && (
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger id="status">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="recruiting">모집중</SelectItem>
                <SelectItem value="closed">모집마감</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onReset}>
          <X className="w-4 h-4 mr-1" />
          초기화
        </Button>
      </div>
    </div>
  )
}
