'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
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
      min_text_length: 300,
      min_photo_count: 3,
    },
  })

  const platform = watch('platform')
  const selectionType = watch('selection_type')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + productImages.length > 5) {
      alert('최대 5개까지만 업로드 가능합니다')
      return
    }

    setProductImages(prev => [...prev, ...files])

    // 미리보기 생성
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

      // 이미지 업로드
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
      router.push('/campaigns')
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError('캠페인 등록 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">새 캠페인 등록</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          체험단 모집 캠페인을 등록하세요
        </p>
      </div>

      <form className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>캠페인의 기본 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">캠페인 제목 *</Label>
              <Input
                id="title"
                placeholder="예) 신제품 A 체험단 모집"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="product_name">제품명 *</Label>
              <Input
                id="product_name"
                placeholder="제품명을 입력하세요"
                {...register('product_name')}
              />
              {errors.product_name && (
                <p className="text-sm text-red-500 mt-1">{errors.product_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="product_description">제품 설명</Label>
              <Textarea
                id="product_description"
                placeholder="제품에 대한 상세 설명을 입력하세요"
                {...register('product_description')}
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="product_price">제품 가격 (원) *</Label>
              <Input
                id="product_price"
                type="number"
                placeholder="10000"
                {...register('product_price', { valueAsNumber: true })}
              />
              {errors.product_price && (
                <p className="text-sm text-red-500 mt-1">{errors.product_price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="product_images">제품 이미지 (최대 5개)</Label>
              <Input
                id="product_images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={uploading}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500 mt-1">
                대표 이미지를 먼저 선택하세요 (첫 번째 이미지가 썸네일로 사용됩니다)
              </p>

              {imagePreview.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`미리보기 ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                          대표
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 플랫폼 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>플랫폼 설정</CardTitle>
            <CardDescription>체험단을 모집할 플랫폼을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platform">플랫폼 *</Label>
              <Select value={platform} onValueChange={(value) => setValue('platform', value as any)}>
                <SelectTrigger>
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
              <>
                <div>
                  <Label htmlFor="product_url_naver">네이버 제품 URL</Label>
                  <Input
                    id="product_url_naver"
                    placeholder="https://smartstore.naver.com/..."
                    {...register('product_url_naver')}
                  />
                  {errors.product_url_naver && (
                    <p className="text-sm text-red-500 mt-1">{errors.product_url_naver.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recruit_count_naver">네이버 모집인원</Label>
                    <Input
                      id="recruit_count_naver"
                      type="number"
                      {...register('recruit_count_naver', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="review_fee_naver">네이버 리뷰 포인트 (원)</Label>
                    <Input
                      id="review_fee_naver"
                      type="number"
                      {...register('review_fee_naver', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </>
            )}

            {(platform === 'coupang' || platform === 'both') && (
              <>
                <div>
                  <Label htmlFor="product_url_coupang">쿠팡 제품 URL</Label>
                  <Input
                    id="product_url_coupang"
                    placeholder="https://www.coupang.com/..."
                    {...register('product_url_coupang')}
                  />
                  {errors.product_url_coupang && (
                    <p className="text-sm text-red-500 mt-1">{errors.product_url_coupang.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recruit_count_coupang">쿠팡 모집인원</Label>
                    <Input
                      id="recruit_count_coupang"
                      type="number"
                      {...register('recruit_count_coupang', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="review_fee_coupang">쿠팡 리뷰 포인트 (원)</Label>
                    <Input
                      id="review_fee_coupang"
                      type="number"
                      {...register('review_fee_coupang', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 일정 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>일정 설정</CardTitle>
            <CardDescription>캠페인 일정을 설정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>모집 시작일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                <Label>모집 마감일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                <Label>당첨자 발표일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                <Label>리뷰 작성 마감일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
          </CardContent>
        </Card>

        {/* 선정 방식 */}
        <Card>
          <CardHeader>
            <CardTitle>선정 방식</CardTitle>
            <CardDescription>체험단 선정 방식을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* 리뷰 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle>리뷰 작성 가이드</CardTitle>
            <CardDescription>리뷰 작성 기준을 설정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_text_length">최소 텍스트 길이 (자)</Label>
                <Input
                  id="min_text_length"
                  type="number"
                  {...register('min_text_length', { valueAsNumber: true })}
                />
                {errors.min_text_length && (
                  <p className="text-sm text-red-500 mt-1">{errors.min_text_length.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="min_photo_count">최소 사진 개수 (장)</Label>
                <Input
                  id="min_photo_count"
                  type="number"
                  {...register('min_photo_count', { valueAsNumber: true })}
                />
                {errors.min_photo_count && (
                  <p className="text-sm text-red-500 mt-1">{errors.min_photo_count.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="keywords">필수 키워드 (쉼표로 구분)</Label>
              <Input
                id="keywords"
                placeholder="예) 품질좋음, 가성비, 추천"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                리뷰에 반드시 포함되어야 할 키워드를 입력하세요
              </p>
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
            className="flex-1"
          >
            {isSubmitting ? '등록 중...' : '등록하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
