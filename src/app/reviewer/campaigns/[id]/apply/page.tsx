'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']

export default function CampaignApplyPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = searchParams.get('platform') as 'naver' | 'coupang'
  const supabase = createClient()
  const { user, reviewerProfile } = useAuthStore()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [message, setMessage] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCampaign()
    }
  }, [id])

  const fetchCampaign = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setCampaign(data)
    } catch (err) {
      console.error('Error fetching campaign:', err)
      setError('캠페인을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreeTerms) {
      alert('주의사항에 동의해주세요')
      return
    }

    if (!user || !reviewerProfile) {
      alert('로그인이 필요합니다')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // 중복 신청 확인
      const { data: existing } = await supabase
        .from('applications')
        .select('*')
        .eq('campaign_id', id)
        .eq('reviewer_id', user.id)
        .eq('platform', platform)
        .single()

      if (existing) {
        alert('이미 신청한 캠페인입니다')
        return
      }

      // 신청 등록
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          campaign_id: id as string,
          reviewer_id: user.id,
          platform: platform,
          message: message || null,
          status: 'applied',
        })

      if (insertError) throw insertError

      alert('캠페인 신청이 완료되었습니다')
      router.push(`/reviewer/campaigns/${id}`)
    } catch (err) {
      console.error('Error applying:', err)
      setError('신청 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  if (error || !campaign) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || '캠페인을 찾을 수 없습니다'}</AlertDescription>
      </Alert>
    )
  }

  if (!platform || !['naver', 'coupang'].includes(platform)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>잘못된 접근입니다</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">캠페인 신청</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {campaign.title} - {platform === 'naver' ? '네이버' : '쿠팡'} 플랫폼
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>신청 정보</CardTitle>
          <CardDescription>
            신청 전 아래 정보를 확인해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">제품명</p>
            <p className="font-medium">{campaign.product_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">제품 가격</p>
            <p className="font-medium">{campaign.product_price.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">리뷰 포인트</p>
            <p className="font-medium">
              {platform === 'naver'
                ? campaign.review_fee_naver.toLocaleString()
                : campaign.review_fee_coupang.toLocaleString()
              }원
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">당첨자 발표</p>
            <p className="font-medium">{new Date(campaign.announce_date).toLocaleDateString('ko-KR')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">리뷰 작성 마감</p>
            <p className="font-medium">{new Date(campaign.review_deadline).toLocaleDateString('ko-KR')}</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>신청 메시지 (선택)</CardTitle>
            <CardDescription>
              업체에게 전달할 메시지를 작성해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="예) 평소 이 제품에 관심이 많았습니다. 성실하게 리뷰 작성하겠습니다."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>주의사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>선정되지 않을 수 있습니다</li>
              <li>선정 시 제품을 구매하고 구매 인증을 해야 합니다</li>
              <li>리뷰 작성 기한을 반드시 지켜주세요</li>
              <li>리뷰 가이드를 준수하지 않으면 포인트가 지급되지 않습니다</li>
              <li>허위 리뷰 작성 시 법적 책임을 질 수 있습니다</li>
            </ul>

            <div className="flex items-start space-x-2 pt-4">
              <Checkbox
                id="agree"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              />
              <label
                htmlFor="agree"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                위 주의사항을 모두 확인했으며 동의합니다
              </label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={!agreeTerms || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? '신청 중...' : '신청하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
