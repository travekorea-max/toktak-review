'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import {
  Tag,
  Info,
  ArrowLeft,
  CreditCard,
  FileText,
  Mail,
  AlertCircle,
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

  const [taxEmail, setTaxEmail] = useState('')

  const paymentWidgetRef = useRef<any>(null)
  const paymentMethodWidgetRef = useRef<any>(null)
  const agreementWidgetRef = useRef<any>(null)

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''

  useEffect(() => {
    fetchCampaign()
  }, [id])

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
  const amount = billing?.creditCard.totalAmount || 0

  const initTossWidget = async () => {
    if (!window.TossPayments || !user) return

    try {
      const customerKey = user.id.replace(/-/g, '').substring(0, 20)
      const tossPayments = window.TossPayments(clientKey)

      const paymentWidget = tossPayments.widgets({
        customerKey,
      })

      paymentWidgetRef.current = paymentWidget

      await paymentWidget.setAmount({
        currency: 'KRW',
        value: amount,
      })

      const paymentMethodWidget = paymentWidget.renderPaymentMethods({
        selector: '#payment-method',
        variantKey: 'DEFAULT',
      })
      paymentMethodWidgetRef.current = paymentMethodWidget

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

  const handlePayment = async () => {
    if (!paymentWidgetRef.current || !campaign || !user || !billing) return

    try {
      setIsSubmitting(true)
      setError(null)

      const orderId = `order-${campaign.id.substring(0, 8)}-${Date.now()}`

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
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!campaign || !billing) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">캠페인을 찾을 수 없습니다</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v2/standard"
        onLoad={() => setSdkLoaded(true)}
      />

      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* 헤더 */}
          <div className="flex items-center gap-4">
            <Link href={`/client/campaigns/${id}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">캠페인 결제</h1>
              <p className="text-sm text-gray-500">
                결제 수단을 선택하고 결제를 진행하세요
              </p>
            </div>
          </div>

          {/* 캠페인 요약 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">캠페인 정보</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">캠페인명</span>
                <span className="text-sm font-medium text-gray-900">{campaign.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">제품명</span>
                <span className="text-sm text-gray-900">{campaign.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">모집 인원</span>
                <span className="text-sm text-gray-900">{billing.creditCard.recruitCount}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">플랫폼</span>
                {campaign.platform === 'naver' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03C75A]/10 text-[#03C75A] text-xs font-medium rounded">
                    <span className="w-4 h-4 bg-[#03C75A] text-white text-[10px] font-bold rounded flex items-center justify-center">N</span>
                    네이버
                  </span>
                ) : campaign.platform === 'coupang' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E53935]/10 text-[#E53935] text-xs font-medium rounded">
                    <span className="w-4 h-4 bg-[#E53935] text-white text-[10px] font-bold rounded flex items-center justify-center">C</span>
                    쿠팡
                  </span>
                ) : (
                  <span className="text-sm text-gray-900">네이버 + 쿠팡</span>
                )}
              </div>
            </div>
          </div>

          {/* 결제 금액 상세 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">결제 금액</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">리뷰어 지급 포인트</span>
                <span className="text-sm text-gray-900">{formatNumber(billing.creditCard.rewardPointTotal)}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">플랫폼 수수료 ({billing.creditCard.recruitCount}명 × 3,000원)</span>
                <span className="text-sm text-gray-900">{formatNumber(billing.creditCard.agencyFeeTotal)}원</span>
              </div>

              <div className="border-t border-gray-50 pt-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">공급가액</span>
                  <span className="text-sm text-gray-900">{formatNumber(billing.creditCard.supplyPrice)}원</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">부가세 (10%)</span>
                  <span className="text-sm text-gray-900">{formatNumber(billing.creditCard.vatAmount)}원</span>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">최종 결제 금액</span>
                  <span className="text-xl font-bold text-[#4F46E5]">
                    {formatNumber(billing.creditCard.totalAmount)}원
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl">
                <Tag className="w-4 h-4" />
                <span>무통장 입금 시 <strong>{billing.savingsFormatted}</strong> 할인!</span>
              </div>
            </div>
          </div>

          {/* 토스 결제 위젯 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">결제 수단</h2>
            </div>
            <div className="p-5">
              {!sdkLoaded ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-sm text-gray-500">결제 위젯 로딩 중...</span>
                </div>
              ) : (
                <>
                  <div id="payment-method" className="w-full" />
                  <div id="agreement" className="w-full mt-4" />
                </>
              )}
            </div>
          </div>

          {/* 세금계산서 이메일 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">세금계산서 발행</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-3">
                결제 완료 후 입력하신 이메일로 세금계산서가 발행됩니다
              </p>
              <div>
                <Label htmlFor="taxEmail" className="text-sm text-gray-700">세금계산서 수신 이메일</Label>
                <Input
                  id="taxEmail"
                  type="email"
                  placeholder="tax@company.com"
                  value={taxEmail}
                  onChange={(e) => setTaxEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* 안내 사항 */}
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-[#4F46E5] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 space-y-1">
                <p>결제 완료 후 관리자 승인을 거쳐 캠페인이 시작됩니다.</p>
                <p>가상계좌 선택 시 입금 확인까지 영업일 기준 1일이 소요될 수 있습니다.</p>
                <p>세금계산서는 결제 완료 후 익월 초에 일괄 발행됩니다.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* 결제 버튼 */}
          <div className="flex gap-3 pb-6">
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
              className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  처리 중...
                </>
              ) : (
                `${formatNumber(amount)}원 결제하기`
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
