'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          문제가 발생했습니다
        </h1>
        <p className="text-gray-500 mb-8">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
          <Link href="/">
            <Button className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA]">
              <Home className="w-4 h-4" />
              홈으로
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
