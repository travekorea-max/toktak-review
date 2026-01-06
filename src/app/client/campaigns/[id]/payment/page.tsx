'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import {
  compareBillingByPaymentMethod,
  formatNumber,
} from '@/lib/billing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  Tag,
  Info,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

declare global {
  interface Window {
    TossPayments: any
  }
}

interface Campaign {
  id: string
  title: string
  product_name: string
  platform: string
  recruit_count_naver: number
  recruit_count_coupang: number
  review_fee_naver: number
  review_fee_coupang: number
  status: string
}

export default function CampaignPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { user, clientProfile } = useAuthStore()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [widgetReady, setWidgetReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 세금계산서 이메일
  const [taxEmail, setTaxEmail] = useState('')

  // 토스 위젯 ref
  const paymentWidgetRef = useRef<any>(null)
  const paymentMethodWidgetRef = useRef<any>(null)
  const agreementWidgetRef = useRef<any>(null)

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''

  useEffect(() => {
    fetchCampaign()
  }, [id])

  // 토스 위젯 초기화
  useEffect(() => {
    if (sdkLoaded && campaign && user && !widgetReady) {
      initTossWidget()
    }
  }, [sdkLoaded, campaign, user])

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setCampaign(data)

      // 기존 결제 여부 확인
      const { data: existingPayment } = await supabase
        .from('campaign_payments')
        .select('id, payment_status')
        .eq('campaign_id', id)
        .single()

      if (existingPayment?.payment_status === 'paid') {
        router.push(`/client/campaigns/${id}`)
      }
    } catch (err) {
      console.error('Error fetching campaign:', err)
      setError('캠페인 정보를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 결제 금액 계산
  const calculateTotals = () => {
    if (!campaign) return null

    let totalRecruitCount = 0
    let totalRewardPoint = 0

    if (campaign.platform === 'naver' || campaign.platform === 'both') {
      totalRecruitCount += campaign.recruit_count_naver
      totalRewardPoint += campaign.recruit_count_naver * campaign.review_fee_naver
    }
    if (campaign.platform === 'coupang' || campaign.platform === 'both') {
      totalRecruitCount += campaign.recruit_count_coupang
      totalRewardPoint += campaign.recruit_count_coupang * campaign.review_fee_coupang
    }

    const avgRewardPoint = totalRecruitCount > 0
      ? Math.round(totalRewardPoint / totalRecruitCount)
      : 0

    return compareBillingByPaymentMethod({
      recruitCount: totalRecruitCount,
      rewardPointPerPerson: avgRewardPoint,
    })
  }

  const billing = calculateTotals()
  // 토스 위젯은 카드 결제 기준 금액 사용
  const amount = billing?.creditCard.totalAmount || 0

  // 토스 위젯 초기화
  const initTossWidget = async () => {
    if (!window.TossPayments || !user) return

    try {
      const customerKey = user.id.replace(/-/g, '').substring(0, 20)
      const tossPayments = window.TossPayments(clientKey)

      // 결제 위젯 초기화
      const paymentWidget = tossPayments.widgets({
        customerKey,
      })

      paymentWidgetRef.current = paymentWidget

      // 금액 설정
      await paymentWidget.setAmount({
        currency: 'KRW',
        value: amount,
      })

      // 결제 수단 위젯 렌더링
      const paymentMethodWidget = paymentWidget.renderPaymentMethods({
        selector: '#payment-method',
        variantKey: 'DEFAULT',
      })
      paymentMethodWidgetRef.current = paymentMethodWidget

      // 약관 동의 위젯 렌더링
      const agreementWidget = paymentWidget.renderAgreement({
        selector: '#agreement',
        variantKey: 'AGREEMENT',
      })
      agreementWidgetRef.current = agreementWidget

      setWidgetReady(true)
    } catch (err) {
      console.error('Toss widget init error:', err)
      setError('결제 위젯 초기화에 실패했습니다')
    }
  }

  // 결제 요청
  const handlePayment = async () => {
    if (!paymentWidgetRef.current || !campaign || !user || !billing) return

    try {
      setIsSubmitting(true)
      setError(null)

      // 주문 ID 생성
      const orderId = `order-${campaign.id.substring(0, 8)}-${Date.now()}`

      // 결제 정보 먼저 DB에 저장
      const { data: payment, error: paymentError } = await supabase
        .from('campaign_payments')
        .insert({
          campaign_id: campaign.id,
          client_id: user.id,
          recruit_count: billing.creditCard.recruitCount,
          reward_point_total: billing.creditCard.rewardPointTotal,
          agency_fee_total: billing.creditCard.agencyFeeTotal,
          base_amount: billing.creditCard.baseAmount,
          surcharge_rate: billing.creditCard.surchargeRate,
          surcharge_amount: billing.creditCard.surchargeAmount,
          supply_price: billing.creditCard.supplyPrice,
          vat_amount: billing.creditCard.vatAmount,
          total_amount: billing.creditCard.totalAmount,
          payment_method: 'bank_transfer',
          payment_status: 'pending',
          tax_invoice_email: taxEmail || null,
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // 토스 결제 요청
      await paymentWidgetRef.current.requestPayment({
        orderId: payment.id,
        orderName: `${campaign.title} 체험단 결제`,
        customerName: clientProfile?.company_name || user.email,
        customerEmail: user.email,
        successUrl: `${window.location.origin}/client/campaigns/${campaign.id}/payment/success`,
        failUrl: `${window.location.origin}/client/campaigns/${campaign.id}/payment/fail`,
      })

    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || '결제 처리 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!campaign || !billing) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>캠페인을 찾을 수 없습니다</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      {/* 토스페이먼츠 SDK */}
      <Script
        src="https://js.tosspayments.com/v2/standard"
        onLoad={() => setSdkLoaded(true)}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">캠페인 결제</h1>
            <p className="text-gray-600 dark:text-gray-400">
              결제 수단을 선택하고 결제를 진행하세요
            </p>
          </div>
        </div>

        {/* 캠페인 요약 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">캠페인 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">캠페인명</span>
                <span className="font-medium">{campaign.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">제품명</span>
                <span>{campaign.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">모집 인원</span>
                <span>{billing.creditCard.recruitCount}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">플랫폼</span>
                <Badge variant="outline">
                  {campaign.platform === 'both' ? '네이버 + 쿠팡' :
                   campaign.platform === 'naver' ? '네이버' : '쿠팡'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 결제 금액 상세 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">결제 금액</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">리뷰어 지급 포인트</span>
              <span>{formatNumber(billing.creditCard.rewardPointTotal)}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">플랫폼 수수료 ({billing.creditCard.recruitCount}명 × 3,000원)</span>
              <span>{formatNumber(billing.creditCard.agencyFeeTotal)}원</span>
            </div>

            <Separator />

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">공급가액</span>
              <span>{formatNumber(billing.creditCard.supplyPrice)}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">부가세 (10%)</span>
              <span>{formatNumber(billing.creditCard.vatAmount)}원</span>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>최종 결제 금액</span>
              <span className="text-blue-600">
                {formatNumber(billing.creditCard.totalAmount)}원
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <Tag className="h-4 w-4" />
              <span>무통장 입금 시 <strong>{billing.savingsFormatted}</strong> 할인!</span>
            </div>
          </CardContent>
        </Card>

        {/* 토스 결제 위젯 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">결제 수단</CardTitle>
            <CardDescription>
              원하시는 결제 수단을 선택해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sdkLoaded ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">결제 위젯 로딩 중...</span>
              </div>
            ) : (
              <>
                <div id="payment-method" className="w-full" />
                <div id="agreement" className="w-full mt-4" />
              </>
            )}
          </CardContent>
        </Card>

        {/* 세금계산서 이메일 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">세금계산서 발행</CardTitle>
            <CardDescription>
              결제 완료 후 입력하신 이메일로 세금계산서가 발행됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="taxEmail">세금계산서 수신 이메일</Label>
              <Input
                id="taxEmail"
                type="email"
                placeholder="tax@company.com"
                value={taxEmail}
                onChange={(e) => setTaxEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>• 결제 완료 후 관리자 승인을 거쳐 캠페인이 시작됩니다.</p>
                <p>• 가상계좌 선택 시 입금 확인까지 영업일 기준 1일이 소요될 수 있습니다.</p>
                <p>• 세금계산서는 결제 완료 후 익월 초에 일괄 발행됩니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 결제 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isSubmitting || !widgetReady}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              `${formatNumber(amount)}원 결제하기`
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
