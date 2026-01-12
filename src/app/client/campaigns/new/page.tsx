'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  CalendarIcon,
  Info,
  Package,
  Coins,
  ArrowLeft,
  FileText,
  Globe,
  Clock,
  Users,
  Image,
  AlertCircle
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const campaignSchema = z.object({
  title: z.string().min(5, '제목은 최소 5자 이상이어야 합니다'),
  product_name: z.string().min(2, '제품명을 입력해주세요'),
  product_description: z.string().optional(),
  product_price: z.number().min(0, '제품 가격을 입력해주세요'),
  product_url_naver: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  product_url_coupang: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  platform: z.enum(['naver', 'coupang', 'both']),
  recruit_count_naver: z.number().min(0),
  recruit_count_coupang: z.number().min(0),
  review_fee_naver: z.number().min(0),
  review_fee_coupang: z.number().min(0),
  product_payback_naver: z.number().min(0),
  product_payback_coupang: z.number().min(0),
  additional_point_naver: z.number().min(0),
  additional_point_coupang: z.number().min(0),
  is_empty_box: z.boolean(),
  selection_type: z.enum(['manual', 'auto_fcfs', 'auto_random']),
  min_text_length: z.number().min(100, '최소 100자 이상'),
  min_photo_count: z.number().min(1, '최소 1장 이상'),
})

type CampaignFormData = z.infer<typeof campaignSchema>

export default function CampaignNewPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()

  const [recruitStartDate, setRecruitStartDate] = useState<Date>()
  const [recruitEndDate, setRecruitEndDate] = useState<Date>()
  const [announceDate, setAnnounceDate] = useState<Date>()
  const [reviewDeadline, setReviewDeadline] = useState<Date>()
  const [keywords, setKeywords] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productImages, setProductImages] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      platform: 'naver',
      selection_type: 'manual',
      recruit_count_naver: 10,
      recruit_count_coupang: 10,
      review_fee_naver: 5000,
      review_fee_coupang: 5000,
      product_payback_naver: 0,
      product_payback_coupang: 0,
      additional_point_naver: 0,
      additional_point_coupang: 0,
      is_empty_box: false,
      min_text_length: 300,
      min_photo_count: 3,
    },
  })

  const platform = watch('platform')
  const selectionType = watch('selection_type')
  const isEmptyBox = watch('is_empty_box')
  const productPrice = watch('product_price')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + productImages.length > 5) {
      alert('최대 5개까지만 업로드 가능합니다')
      return
    }

    setProductImages(prev => [...prev, ...files])

    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index))
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async () => {
    if (productImages.length === 0) return []

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of productImages) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError, data } = await supabase.storage
          .from('campaign-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-images')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      return uploadedUrls
    } catch (err) {
      console.error('Image upload error:', err)
      throw new Error('이미지 업로드에 실패했습니다')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: CampaignFormData, isDraft: boolean = false) => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (!user) {
        alert('로그인이 필요합니다')
        return
      }

      if (!isDraft) {
        if (!recruitStartDate || !recruitEndDate || !announceDate || !reviewDeadline) {
          alert('모든 날짜를 선택해주세요')
          return
        }
      }

      const keywordArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      const imageUrls = await uploadImages()

      const { error: insertError } = await supabase
        .from('campaigns')
        .insert({
          client_id: user.id,
          title: data.title,
          product_name: data.product_name,
          product_description: data.product_description || null,
          product_price: data.product_price,
          product_images: imageUrls.length > 0 ? imageUrls : null,
          product_url_naver: data.product_url_naver || null,
          product_url_coupang: data.product_url_coupang || null,
          platform: data.platform,
          recruit_count_naver: data.recruit_count_naver,
          recruit_count_coupang: data.recruit_count_coupang,
          review_fee_naver: data.review_fee_naver,
          review_fee_coupang: data.review_fee_coupang,
          product_payback_naver: data.product_payback_naver || data.product_price,
          product_payback_coupang: data.product_payback_coupang || data.product_price,
          additional_point_naver: data.additional_point_naver || 0,
          additional_point_coupang: data.additional_point_coupang || 0,
          is_empty_box: data.is_empty_box || false,
          recruit_start_date: recruitStartDate?.toISOString() || new Date().toISOString(),
          recruit_end_date: recruitEndDate?.toISOString() || new Date().toISOString(),
          announce_date: announceDate?.toISOString() || new Date().toISOString(),
          review_deadline: reviewDeadline?.toISOString() || new Date().toISOString(),
          selection_type: data.selection_type,
          min_text_length: data.min_text_length,
          min_photo_count: data.min_photo_count,
          required_keywords: keywordArray.length > 0 ? keywordArray : null,
          status: isDraft ? 'draft' : 'pending',
        })

      if (insertError) throw insertError

      alert(isDraft ? '임시저장되었습니다' : '캠페인이 등록되었습니다. 관리자 승인 후 모집이 시작됩니다.')
      router.push('/client/campaigns')
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError('캠페인 등록 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Link href="/client/campaigns">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">새 캠페인 등록</h1>
            <p className="text-sm text-gray-500">체험단 모집 캠페인을 등록하세요</p>
          </div>
        </div>

        <form className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">기본 정보</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  캠페인 제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="예) 신제품 A 체험단 모집"
                  className="mt-1.5"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="product_name" className="text-sm font-medium text-gray-700">
                  제품명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product_name"
                  placeholder="제품명을 입력하세요"
                  className="mt-1.5"
                  {...register('product_name')}
                />
                {errors.product_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.product_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="product_description" className="text-sm font-medium text-gray-700">
                  제품 설명
                </Label>
                <Textarea
                  id="product_description"
                  placeholder="제품에 대한 상세 설명을 입력하세요"
                  className="mt-1.5"
                  {...register('product_description')}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="product_price" className="text-sm font-medium text-gray-700">
                  제품 가격 (원) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product_price"
                  type="number"
                  placeholder="10000"
                  className="mt-1.5"
                  {...register('product_price', { valueAsNumber: true })}
                />
                {errors.product_price && (
                  <p className="text-sm text-red-500 mt-1">{errors.product_price.message}</p>
                )}
              </div>

              {/* 이미지 업로드 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  제품 이미지 (최대 5개)
                </Label>
                <div className="mt-1.5">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="text-center">
                      <Image className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">클릭하여 이미지 업로드</p>
                      <p className="text-xs text-gray-400 mt-1">첫 번째 이미지가 썸네일로 사용됩니다</p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`미리보기 ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#4F46E5] text-white text-[10px] px-1.5 py-0.5 rounded">
                            대표
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 플랫폼 설정 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">플랫폼 설정</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  플랫폼 <span className="text-red-500">*</span>
                </Label>
                <Select value={platform} onValueChange={(value) => setValue('platform', value as any)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="naver">네이버만</SelectItem>
                    <SelectItem value="coupang">쿠팡만</SelectItem>
                    <SelectItem value="both">네이버 + 쿠팡</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(platform === 'naver' || platform === 'both') && (
                <div className="p-4 bg-[#03C75A]/5 border border-[#03C75A]/20 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#03C75A] text-white text-xs font-bold rounded flex items-center justify-center">N</span>
                    <span className="font-medium text-gray-900">네이버</span>
                  </div>
                  <div>
                    <Label htmlFor="product_url_naver" className="text-sm text-gray-600">제품 URL</Label>
                    <Input
                      id="product_url_naver"
                      placeholder="https://smartstore.naver.com/..."
                      className="mt-1.5 bg-white"
                      {...register('product_url_naver')}
                    />
                    {errors.product_url_naver && (
                      <p className="text-sm text-red-500 mt-1">{errors.product_url_naver.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recruit_count_naver" className="text-sm text-gray-600">모집인원</Label>
                      <Input
                        id="recruit_count_naver"
                        type="number"
                        className="mt-1.5 bg-white"
                        {...register('recruit_count_naver', { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="review_fee_naver" className="text-sm text-gray-600">리뷰 포인트 (원)</Label>
                      <Input
                        id="review_fee_naver"
                        type="number"
                        className="mt-1.5 bg-white"
                        {...register('review_fee_naver', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(platform === 'coupang' || platform === 'both') && (
                <div className="p-4 bg-[#E53935]/5 border border-[#E53935]/20 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#E53935] text-white text-xs font-bold rounded flex items-center justify-center">C</span>
                    <span className="font-medium text-gray-900">쿠팡</span>
                  </div>
                  <div>
                    <Label htmlFor="product_url_coupang" className="text-sm text-gray-600">제품 URL</Label>
                    <Input
                      id="product_url_coupang"
                      placeholder="https://www.coupang.com/..."
                      className="mt-1.5 bg-white"
                      {...register('product_url_coupang')}
                    />
                    {errors.product_url_coupang && (
                      <p className="text-sm text-red-500 mt-1">{errors.product_url_coupang.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recruit_count_coupang" className="text-sm text-gray-600">모집인원</Label>
                      <Input
                        id="recruit_count_coupang"
                        type="number"
                        className="mt-1.5 bg-white"
                        {...register('recruit_count_coupang', { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="review_fee_coupang" className="text-sm text-gray-600">리뷰 포인트 (원)</Label>
                      <Input
                        id="review_fee_coupang"
                        type="number"
                        className="mt-1.5 bg-white"
                        {...register('review_fee_coupang', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 포인트 설정 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">리뷰어 포인트 설정</h2>
            </div>
            <div className="p-5 space-y-5">
              {/* 안내 */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>제품가격 페이백:</strong> 리뷰어가 제품 구매 후 돌려받는 금액입니다.</p>
                    <p><strong>추가 포인트:</strong> 빈박스 제공 시 리뷰어에게 지급하는 추가 보상입니다.</p>
                    <p className="text-blue-600 font-medium">예시: 2만원 제품 → 2만원 페이백 + 빈박스 시 1,000원 추가</p>
                  </div>
                </div>
              </div>

              {/* 빈박스 여부 */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <Checkbox
                  id="is_empty_box"
                  checked={isEmptyBox}
                  onCheckedChange={(checked) => setValue('is_empty_box', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="is_empty_box" className="text-sm font-medium cursor-pointer">
                    빈박스 제공
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    제품 없이 빈박스만 제공하는 경우 체크하세요
                  </p>
                </div>
                <Package className="w-5 h-5 text-gray-400" />
              </div>

              {/* 네이버 포인트 설정 */}
              {(platform === 'naver' || platform === 'both') && (
                <div className="p-4 border border-[#03C75A]/30 rounded-xl bg-[#03C75A]/5">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#03C75A] text-white text-xs font-bold rounded flex items-center justify-center">N</span>
                    네이버 포인트
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product_payback_naver" className="text-sm text-gray-600">제품가격 페이백 (원)</Label>
                      <Input
                        id="product_payback_naver"
                        type="number"
                        placeholder={productPrice?.toString() || '제품 가격과 동일'}
                        className="mt-1.5 bg-white"
                        {...register('product_payback_naver', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-gray-500 mt-1">보통 제품 가격과 동일하게 설정</p>
                    </div>
                    <div>
                      <Label htmlFor="additional_point_naver" className="text-sm text-gray-600">
                        추가 포인트 (원)
                        {isEmptyBox && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="additional_point_naver"
                        type="number"
                        placeholder={isEmptyBox ? '1000' : '0'}
                        className="mt-1.5 bg-white"
                        {...register('additional_point_naver', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-gray-500 mt-1">빈박스 제공 시 최소 1,000원 권장</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 쿠팡 포인트 설정 */}
              {(platform === 'coupang' || platform === 'both') && (
                <div className="p-4 border border-[#E53935]/30 rounded-xl bg-[#E53935]/5">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#E53935] text-white text-xs font-bold rounded flex items-center justify-center">C</span>
                    쿠팡 포인트
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product_payback_coupang" className="text-sm text-gray-600">제품가격 페이백 (원)</Label>
                      <Input
                        id="product_payback_coupang"
                        type="number"
                        placeholder={productPrice?.toString() || '제품 가격과 동일'}
                        className="mt-1.5 bg-white"
                        {...register('product_payback_coupang', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-gray-500 mt-1">보통 제품 가격과 동일하게 설정</p>
                    </div>
                    <div>
                      <Label htmlFor="additional_point_coupang" className="text-sm text-gray-600">
                        추가 포인트 (원)
                        {isEmptyBox && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="additional_point_coupang"
                        type="number"
                        placeholder={isEmptyBox ? '1000' : '0'}
                        className="mt-1.5 bg-white"
                        {...register('additional_point_coupang', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-gray-500 mt-1">빈박스 제공 시 최소 1,000원 권장</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 동시 진행 안내 */}
              {platform === 'both' && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium">네이버+쿠팡 동시 진행 시 안내</p>
                      <p className="mt-1">제품은 1개만 제공되거나 빈박스만 제공될 수 있습니다. 플랫폼별로 포인트를 다르게 설정할 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 일정 설정 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">일정 설정</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    모집 시작일 <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start mt-1.5 font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {recruitStartDate ? format(recruitStartDate, 'PPP', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={recruitStartDate}
                        onSelect={setRecruitStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    모집 마감일 <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start mt-1.5 font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {recruitEndDate ? format(recruitEndDate, 'PPP', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={recruitEndDate}
                        onSelect={setRecruitEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    당첨자 발표일 <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start mt-1.5 font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {announceDate ? format(announceDate, 'PPP', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={announceDate}
                        onSelect={setAnnounceDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    리뷰 작성 마감일 <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start mt-1.5 font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {reviewDeadline ? format(reviewDeadline, 'PPP', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={reviewDeadline}
                        onSelect={setReviewDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* 선정 방식 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">선정 방식</h2>
            </div>
            <div className="p-5">
              <Select value={selectionType} onValueChange={(value) => setValue('selection_type', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">수동 선정 (직접 선택)</SelectItem>
                  <SelectItem value="auto_fcfs">자동 선정 (선착순)</SelectItem>
                  <SelectItem value="auto_random">자동 선정 (랜덤)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                {selectionType === 'manual' && '지원자 목록을 직접 확인하고 선정합니다.'}
                {selectionType === 'auto_fcfs' && '모집 마감 시 선착순으로 자동 선정됩니다.'}
                {selectionType === 'auto_random' && '모집 마감 시 무작위로 자동 선정됩니다.'}
              </p>
            </div>
          </div>

          {/* 리뷰 가이드 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="font-semibold text-gray-900">리뷰 작성 가이드</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_text_length" className="text-sm font-medium text-gray-700">
                    최소 텍스트 길이 (자)
                  </Label>
                  <Input
                    id="min_text_length"
                    type="number"
                    className="mt-1.5"
                    {...register('min_text_length', { valueAsNumber: true })}
                  />
                  {errors.min_text_length && (
                    <p className="text-sm text-red-500 mt-1">{errors.min_text_length.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="min_photo_count" className="text-sm font-medium text-gray-700">
                    최소 사진 개수 (장)
                  </Label>
                  <Input
                    id="min_photo_count"
                    type="number"
                    className="mt-1.5"
                    {...register('min_photo_count', { valueAsNumber: true })}
                  />
                  {errors.min_photo_count && (
                    <p className="text-sm text-red-500 mt-1">{errors.min_photo_count.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="keywords" className="text-sm font-medium text-gray-700">
                  필수 키워드 (쉼표로 구분)
                </Label>
                <Input
                  id="keywords"
                  placeholder="예) 품질좋음, 가성비, 추천"
                  className="mt-1.5"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  리뷰에 반드시 포함되어야 할 키워드를 입력하세요
                </p>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex gap-3 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isSubmitting}
            >
              임시저장
            </Button>
            <Button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={isSubmitting}
              className="flex-[2] bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
