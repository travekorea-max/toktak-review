import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-bold text-[#4F46E5] mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-gray-500 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <div className="flex gap-3 justify-center">
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
