import Link from 'next/link'
import { Star } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      {/* 헤더 */}
      <header className="h-14 border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#4F46E5] rounded-lg flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">톡톡리뷰</span>
          </Link>
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="py-6 text-center">
        <p className="text-xs text-gray-400">
          © 2025 톡톡리뷰. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
