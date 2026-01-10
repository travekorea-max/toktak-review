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
  CheckCircle,
  FileText,
  Image,
  Type,
  Hash,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row'] & {
  campaigns?: Database['public']['Tables']['campaigns']['Row']
}

export default function ReviewSubmitPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [application, setApplication] = useState<Application | null>(null)
  const [reviewUrl, setReviewUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reviewUrl.trim()) {
      setError('리뷰 URL을 입력해주세요')
      return
    }

    if (!imageFile) {
      setError('리뷰 스크린샷을 업로드해주세요')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const imageUrl = imagePreview

      const { error: insertError } = await supabase
        .from('review_submissions')
        .insert({
          application_id: id as string,
          review_url: reviewUrl,
          image_url: imageUrl,
          platform: application?.platform || 'naver',
          status: 'pending',
        })

      if (insertError) throw insertError

      alert('리뷰가 제출되었습니다. 검수 후 포인트가 지급됩니다.')
      router.push(`/reviewer/my-activities/${id}`)
    } catch (err) {
      console.error('Error submitting review:', err)
      setError('리뷰 제출 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href={`/reviewer/my-activities/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          활동 상세
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">리뷰 작성</h1>
          <p className="text-sm text-gray-500 mt-1">{campaign.title}</p>
        </div>

        {/* 안내사항 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <ul className="text-sm text-blue-700 space-y-1">
              <li>리뷰 작성 후 리뷰 URL과 스크린샷을 제출해주세요</li>
              <li>리뷰 가이드를 준수하지 않으면 포인트가 지급되지 않을 수 있습니다</li>
              <li>허위 리뷰 작성 시 법적 책임을 질 수 있습니다</li>
            </ul>
          </div>
        </div>

        {/* 리뷰 가이드 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">리뷰 작성 가이드</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Type className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">최소 글자 수</p>
                <p className="text-sm text-gray-500">{campaign.min_text_length}자 이상</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">최소 사진 수</p>
                <p className="text-sm text-gray-500">{campaign.min_photo_count}장 이상</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
            </div>

            {campaign.required_keywords && campaign.required_keywords.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Hash className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">필수 키워드</p>
                </div>
                <div className="flex flex-wrap gap-2 ml-11">
                  {campaign.required_keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-full text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 리뷰 제출 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">리뷰 정보 입력</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reviewUrl" className="text-sm font-medium text-gray-700">
                  리뷰 URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reviewUrl"
                  type="url"
                  placeholder="https://..."
                  value={reviewUrl}
                  onChange={(e) => setReviewUrl(e.target.value)}
                  className="h-11 bg-white border-gray-200"
                  required
                />
                <p className="text-xs text-gray-500">작성한 리뷰 페이지의 URL을 입력하세요</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  리뷰 스크린샷 <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2">
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-lg p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium text-[#4F46E5]">클릭하여 업로드</span>
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG (최대 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  작성한 리뷰 전체 화면의 스크린샷을 업로드해주세요
                </p>
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
              disabled={isSubmitting || !reviewUrl || !imageFile}
              className="flex-1 h-11 bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  제출 중...
                </>
              ) : (
                '제출하기'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
