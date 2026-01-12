'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { CampaignFilters } from '@/components/campaigns/CampaignFilters'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

export default function ClientCampaignsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [platform, setPlatform] = useState('all')

  useEffect(() => {
    if (user) {
      fetchCampaigns()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [campaigns, searchQuery, platform, activeTab])

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user) return

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', user.id)
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
      filtered = filtered.filter((campaign) => campaign.status === activeTab)
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

  const getCampaignCount = (status: string) => {
    if (status === 'all') return campaigns.length
    return campaigns.filter((c) => c.status === status).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">캠페인 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            등록한 캠페인을 관리하세요
          </p>
        </div>
        <Button onClick={() => router.push('/client/campaigns/new')}>
          <Plus className="w-4 h-4 mr-2" />
          새 캠페인 등록
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            전체 ({getCampaignCount('all')})
          </TabsTrigger>
          <TabsTrigger value="draft">
            임시저장 ({getCampaignCount('draft')})
          </TabsTrigger>
          <TabsTrigger value="pending">
            승인대기 ({getCampaignCount('pending')})
          </TabsTrigger>
          <TabsTrigger value="recruiting">
            모집중 ({getCampaignCount('recruiting')})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            진행중 ({getCampaignCount('in_progress')})
          </TabsTrigger>
          <TabsTrigger value="completed">
            완료 ({getCampaignCount('completed')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {campaigns.length === 0
                  ? '등록된 캠페인이 없습니다'
                  : '검색 결과가 없습니다'}
              </p>
              {campaigns.length === 0 && (
                <Button
                  onClick={() => router.push('/client/campaigns/new')}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 캠페인 등록하기
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} viewMode="client" />
              ))}
            </div>
          )}

          {!isLoading && filteredCampaigns.length > 0 && (
            <div className="text-center text-sm text-gray-500">
              총 {filteredCampaigns.length}개의 캠페인
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
