'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Heart,
  ShoppingCart,
  Receipt,
  ExternalLink,
  Eye,
  X,
  User,
  Calendar,
  Hash
} from 'lucide-react'
import { Database } from '@/types/database'

type PurchaseVerification = Database['public']['Tables']['purchase_verifications']['Row'] & {
  applications?: {
    id: string
    platform: string
    reviewer_id: string
    campaigns?: {
      id: string
      title: string
      product_name: string
      product_price: number
    }
    reviewer_profiles?: {
      name: string
      naver_id: string | null
      coupang_id: string | null
    }
  }
}

const tabs = [
  { id: 'pending', label: '검토대기' },
  { id: 'approved', label: '승인' },
  { id: 'rejected', label: '반려' },
  { id: 'all', label: '전체' },
]

export default function VerificationsPage() {
  const supabase = createClient()

  const [verifications, setVerifications] = useState<PurchaseVerification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedVerification, setSelectedVerification] = useState<PurchaseVerification | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  useEffect(() => {
    fetchVerifications()
  }, [])

  const fetchVerifications = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('purchase_verifications')
        .select(`
          *,
          applications (
            id,
            platform,
            reviewer_id,
            campaigns (
              id,
              title,
              product_name,
              product_price
            ),
            reviewer_profiles:reviewer_id (
              name,
              naver_id,
              coupang_id
            )
          )
        `)
        .order('created_at', { ascending: false })

      setVerifications(data || [])
    } catch (err) {
      console.error('Error fetching verifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (verification: PurchaseVerification) => {
    if (!confirm('이 구매 인증을 승인하시겠습니까?')) return

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('purchase_verifications')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString(),
        })
        .eq('id', verification.id)

      if (error) throw error

      alert('구매 인증이 승인되었습니다')
      setSelectedVerification(null)
      fetchVerifications()
    } catch (err) {
      console.error('Error approving verification:', err)
      alert('승인 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedVerification) return
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요')
      return
    }

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('purchase_verifications')
        .update({
          status: 'rejected',
          verified_at: new Date().toISOString(),
        })
        .eq('id', selectedVerification.id)

      if (error) throw error

      alert('구매 인증이 반려되었습니다')
      setShowRejectDialog(false)
      setRejectReason('')
      setSelectedVerification(null)
      fetchVerifications()
    } catch (err) {
      console.error('Error rejecting verification:', err)
      alert('반려 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const getFilteredVerifications = () => {
    if (activeTab === 'all') return verifications
    return verifications.filter(v => v.status === activeTab)
  }

  const filteredVerifications = getFilteredVerifications()
  const counts = {
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
    all: verifications.length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">구매 인증 검토</h1>
          <p className="text-sm text-gray-500 mt-1">
            리뷰어들의 구매 인증을 검토하고 승인하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">전체</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm text-gray-500">검토대기</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">승인</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{counts.approved}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-gray-500">반려</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${activeTab === tab.id ? 'text-white/80' : 'text-gray-400'}`}>
                {counts[tab.id as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-xl border border-gray-100">
          {filteredVerifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">검토할 인증이 없습니다</h3>
              <p className="text-sm text-gray-500">
                {activeTab === 'pending' ? '대기 중인 구매 인증이 없습니다' : '해당 상태의 인증이 없습니다'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredVerifications.map((verification) => {
                const app = verification.applications
                const campaign = app?.campaigns
                const reviewer = app?.reviewer_profiles as any
                const isNaver = app?.platform === 'naver'

                return (
                  <div
                    key={verification.id}
                    className="p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            verification.status === 'pending'
                              ? 'bg-amber-50 text-amber-600'
                              : verification.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {verification.status === 'pending' ? '검토대기' :
                             verification.status === 'approved' ? '승인' : '반려'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isNaver ? 'bg-[#03C75A]/10 text-[#03C75A]' : 'bg-[#E53935]/10 text-[#E53935]'
                          }`}>
                            {isNaver ? '네이버' : '쿠팡'}
                          </span>
                        </div>

                        <h3 className="font-medium text-gray-900 mb-1">
                          {campaign?.title || '캠페인 정보 없음'}
                        </h3>
                        <p className="text-sm text-gray-500">{campaign?.product_name}</p>

                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1 text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            {reviewer?.name || '이름 없음'}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Hash className="w-3.5 h-3.5" />
                            {verification.order_number}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(verification.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>

                        {/* 인증 이미지 미리보기 */}
                        <div className="flex gap-2 mt-3">
                          {isNaver && verification.wishlist_image_url && (
                            <div className="relative group">
                              <img
                                src={verification.wishlist_image_url}
                                alt="찜 인증"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Heart className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                          {isNaver && verification.cart_image_url && (
                            <div className="relative group">
                              <img
                                src={verification.cart_image_url}
                                alt="장바구니 인증"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                          {verification.purchase_image_url && (
                            <div className="relative group">
                              <img
                                src={verification.purchase_image_url}
                                alt="구매내역 인증"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Receipt className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVerification(verification)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          상세보기
                        </Button>
                        {verification.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handleApprove(verification)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setSelectedVerification(verification)
                                setShowRejectDialog(true)
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              반려
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 상세보기 모달 */}
      {selectedVerification && !showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">구매 인증 상세</h2>
              <button
                onClick={() => setSelectedVerification(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 리뷰어 정보 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">리뷰어 정보</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">이름</p>
                    <p className="font-medium text-gray-900">
                      {(selectedVerification.applications?.reviewer_profiles as any)?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">플랫폼 ID</p>
                    <p className="font-medium text-gray-900">
                      {selectedVerification.applications?.platform === 'naver'
                        ? (selectedVerification.applications?.reviewer_profiles as any)?.naver_id
                        : (selectedVerification.applications?.reviewer_profiles as any)?.coupang_id
                      || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">주문번호</p>
                    <p className="font-medium text-gray-900">{selectedVerification.order_number}</p>
                  </div>
                </div>
              </div>

              {/* 인증 이미지 */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">인증 이미지</h3>
                <div className="grid grid-cols-3 gap-4">
                  {selectedVerification.applications?.platform === 'naver' && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-gray-700">찜 인증</span>
                        </div>
                        {selectedVerification.wishlist_image_url ? (
                          <img
                            src={selectedVerification.wishlist_image_url}
                            alt="찜 인증"
                            className="w-full aspect-square object-contain bg-gray-100 rounded-lg border"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-400">이미지 없음</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-gray-700">장바구니 인증</span>
                        </div>
                        {selectedVerification.cart_image_url ? (
                          <img
                            src={selectedVerification.cart_image_url}
                            alt="장바구니 인증"
                            className="w-full aspect-square object-contain bg-gray-100 rounded-lg border"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-400">이미지 없음</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">구매내역 인증</span>
                    </div>
                    {selectedVerification.purchase_image_url || selectedVerification.image_url ? (
                      <img
                        src={selectedVerification.purchase_image_url || selectedVerification.image_url}
                        alt="구매내역 인증"
                        className="w-full aspect-square object-contain bg-gray-100 rounded-lg border"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-400">이미지 없음</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              {selectedVerification.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => handleApprove(selectedVerification)}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    승인
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    반려
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">구매 인증 반려</h2>
              <p className="text-sm text-gray-500 mt-1">반려 사유를 입력해주세요</p>
            </div>

            <div className="p-6">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="반려 사유를 상세히 입력해주세요"
                className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectReason('')
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
              >
                {isProcessing ? '처리 중...' : '반려'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
