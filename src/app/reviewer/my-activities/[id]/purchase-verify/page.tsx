'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Upload,
  Info,
  ShoppingBag,
  ExternalLink,
  Loader2,
  AlertCircle,
  Heart,
  ShoppingCart,
  Receipt,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row'] & {
  campaigns?: Database['public']['Tables']['campaigns']['Row']
}

interface VerificationStep {
  id: string
  label: string
  description: string
  icon: any
  required: boolean
}

const naverSteps: VerificationStep[] = [
  {
    id: 'wishlist',
    label: '찜 인증',
    description: '상품을 찜한 화면을 캡처해주세요',
    icon: Heart,
    required: true
  },
  {
    id: 'cart',
    label: '장바구니 인증',
    description: '장바구니에 담긴 화면을 캡처해주세요',
    icon: ShoppingCart,
    required: true
  },
  {
    id: 'purchase',
    label: '구매내역 인증',
    description: '주문번호가 보이는 구매내역을 캡처해주세요',
    icon: Receipt,
    required: true
  }
]

const coupangSteps: VerificationStep[] = [
  {
    id: 'purchase',
    label: '구매내역 인증',
    description: '주문번호가 보이는 구매내역을 캡처해주세요',
    icon: Receipt,
    required: true
  }
]

export default function PurchaseVerifyPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [application, setApplication] = useState<Application | null>(null)
  const [orderNumber, setOrderNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 각 단계별 이미지
  const [wishlistImage, setWishlistImage] = useState<string>('')
  const [cartImage, setCartImage] = useState<string>('')
  const [purchaseImage, setPurchaseImage] = useState<string>('')

  useEffect(() => {
    if (id) {
      fetchApplication()
    }
  }, [id])

  const fetchApplication = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          campaigns (*)
        `)
        .eq('id', id)
        .single()

      setApplication(data)
    } catch (err) {
      console.error('Error fetching application:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (value: string) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isNaver = application?.platform === 'naver'

    if (!orderNumber.trim()) {
      setError('주문번호를 입력해주세요')
      return
    }

    if (isNaver) {
      if (!wishlistImage) {
        setError('찜 인증 이미지를 업로드해주세요')
        return
      }
      if (!cartImage) {
        setError('장바구니 인증 이미지를 업로드해주세요')
        return
      }
    }

    if (!purchaseImage) {
      setError('구매내역 인증 이미지를 업로드해주세요')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const { error: insertError } = await supabase
        .from('purchase_verifications')
        .insert({
          application_id: id as string,
          order_number: orderNumber,
          image_url: purchaseImage,
          wishlist_image_url: isNaver ? wishlistImage : null,
          cart_image_url: isNaver ? cartImage : null,
          purchase_image_url: purchaseImage,
          platform: application?.platform || 'naver',
          status: 'pending',
        })

      if (insertError) throw insertError

      alert('구매 인증이 제출되었습니다. 검토 후 승인됩니다.')
      router.push(`/reviewer/my-activities/${id}`)
    } catch (err) {
      console.error('Error submitting verification:', err)
      setError('구매 인증 제출 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isNaver = application?.platform === 'naver'
  const steps = isNaver ? naverSteps : coupangSteps

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-lg mx-auto px-6 py-8">
          <Skeleton className="h-5 w-24 mb-6" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <Skeleton className="h-32 rounded-xl mb-6" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!application || !application.campaigns) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-700 mb-1">잘못된 접근입니다</h2>
            <p className="text-sm text-red-600 mb-4">신청 정보를 찾을 수 없습니다.</p>
            <Link href="/reviewer/my-activities">
              <Button className="bg-red-600 hover:bg-red-700">목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const campaign = application.campaigns

  // 포인트 계산 (제품가격 페이백 + 추가 포인트)
  const productPayback = isNaver
    ? (campaign.product_payback_naver || campaign.product_price)
    : (campaign.product_payback_coupang || campaign.product_price)
  const additionalPoint = isNaver
    ? (campaign.additional_point_naver || 0)
    : (campaign.additional_point_coupang || 0)
  const totalPoint = productPayback + additionalPoint

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href={`/reviewer/my-activities/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          활동 상세
        </Link>

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">구매 인증</h1>
          <p className="text-sm text-gray-500 mt-1">{campaign.title}</p>
        </div>

        {/* 중요 공지 */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">필수 확인사항</p>
              <p className="text-sm text-red-600">
                톡톡리뷰 가입 시 등록한 성함과 쇼핑몰 구매자 성함이 <span className="font-bold">반드시 일치</span>해야 합니다.
                불일치 시 인증이 거부될 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 포인트 안내 */}
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl p-5 mb-6 text-white">
          <p className="text-white/80 text-sm mb-2">리뷰 완료 시 지급 포인트</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-white/90">제품가격 페이백</span>
              <span className="font-semibold">{productPayback.toLocaleString()}P</span>
            </div>
            {additionalPoint > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-white/90">추가 포인트 {campaign.is_empty_box ? '(빈박스)' : ''}</span>
                <span className="font-semibold">+{additionalPoint.toLocaleString()}P</span>
              </div>
            )}
            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">총 지급 포인트</span>
                <span className="text-2xl font-bold">{totalPoint.toLocaleString()}P</span>
              </div>
            </div>
          </div>
        </div>

        {/* 안내사항 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <ul className="text-sm text-blue-700 space-y-1">
              {isNaver ? (
                <>
                  <li>1. 상품을 찜(좋아요) 해주세요</li>
                  <li>2. 장바구니에 담아주세요</li>
                  <li>3. 구매를 완료해주세요</li>
                  <li>4. 각 단계별 스크린샷을 업로드해주세요</li>
                </>
              ) : (
                <>
                  <li>1. 구매를 완료해주세요</li>
                  <li>2. 주문번호가 보이는 구매내역을 캡처해주세요</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* 제품 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">제품 정보</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{campaign.product_name}</p>
              <p className="text-sm text-gray-500">{campaign.product_price.toLocaleString()}원</p>
            </div>
          </div>

          {isNaver && campaign.product_url_naver && (
            <a
              href={campaign.product_url_naver}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 w-full justify-center px-4 py-2.5 bg-[#03C75A] text-white rounded-lg text-sm font-medium hover:bg-[#02b351] transition-colors"
            >
              네이버에서 구매하기
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {!isNaver && campaign.product_url_coupang && (
            <a
              href={campaign.product_url_coupang}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 w-full justify-center px-4 py-2.5 bg-[#E53935] text-white rounded-lg text-sm font-medium hover:bg-[#d32f2f] transition-colors"
            >
              쿠팡에서 구매하기
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* 구매 인증 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 주문번호 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">주문 정보</h2>
            <div className="space-y-2">
              <Label htmlFor="orderNumber" className="text-sm font-medium text-gray-700">
                주문번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orderNumber"
                placeholder="주문번호를 입력하세요"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="h-11 bg-white border-gray-200"
                required
              />
            </div>
          </div>

          {/* 단계별 인증 이미지 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">인증 이미지 업로드</h2>

            <div className="space-y-4">
              {/* 찜 인증 (네이버만) */}
              {isNaver && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      wishlistImage ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {wishlistImage ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Heart className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">찜 인증 <span className="text-red-500">*</span></p>
                      <p className="text-xs text-gray-500">상품을 찜한 화면을 캡처해주세요</p>
                    </div>
                  </div>
                  <input
                    id="wishlist-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setWishlistImage)}
                    className="hidden"
                  />
                  <label
                    htmlFor="wishlist-image"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors"
                  >
                    {wishlistImage ? (
                      <img src={wishlistImage} alt="찜 인증" className="w-full h-full object-contain rounded-lg p-1" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">클릭하여 업로드</p>
                      </div>
                    )}
                  </label>
                </div>
              )}

              {/* 장바구니 인증 (네이버만) */}
              {isNaver && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      cartImage ? 'bg-emerald-100' : 'bg-orange-100'
                    }`}>
                      {cartImage ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">장바구니 인증 <span className="text-red-500">*</span></p>
                      <p className="text-xs text-gray-500">장바구니에 담긴 화면을 캡처해주세요</p>
                    </div>
                  </div>
                  <input
                    id="cart-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setCartImage)}
                    className="hidden"
                  />
                  <label
                    htmlFor="cart-image"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors"
                  >
                    {cartImage ? (
                      <img src={cartImage} alt="장바구니 인증" className="w-full h-full object-contain rounded-lg p-1" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">클릭하여 업로드</p>
                      </div>
                    )}
                  </label>
                </div>
              )}

              {/* 구매내역 인증 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    purchaseImage ? 'bg-emerald-100' : 'bg-blue-100'
                  }`}>
                    {purchaseImage ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Receipt className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">구매내역 인증 <span className="text-red-500">*</span></p>
                    <p className="text-xs text-gray-500">주문번호가 보이는 구매내역을 캡처해주세요</p>
                  </div>
                </div>
                <input
                  id="purchase-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setPurchaseImage)}
                  className="hidden"
                />
                <label
                  htmlFor="purchase-image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors"
                >
                  {purchaseImage ? (
                    <img src={purchaseImage} alt="구매내역 인증" className="w-full h-full object-contain rounded-lg p-1" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">클릭하여 업로드</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-11"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !orderNumber || !purchaseImage || (isNaver && (!wishlistImage || !cartImage))}
              className="flex-1 h-11 bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  제출 중...
                </>
              ) : (
                '인증 제출하기'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
