'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'

interface ImageGalleryProps {
  images: string[] | null
  productName: string
}

const sampleImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=600&fit=crop',
]

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // 실제 이미지가 있으면 사용, 없으면 샘플 이미지
  const displayImages = images && images.length > 0 ? images : sampleImages

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))
  }

  if (displayImages.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gray-100 rounded-xl flex items-center justify-center mb-6">
        <div className="text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">이미지 없음</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {/* 메인 이미지 */}
      <div className="relative aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden group">
        <img
          src={displayImages[currentIndex]}
          alt={`${productName} - ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* 이전/다음 버튼 */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* 이미지 카운터 */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
            {currentIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* 썸네일 */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`${productName} 썸네일 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
