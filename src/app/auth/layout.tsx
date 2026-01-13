import Link from 'next/link'
import { Star, Sparkles } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-white to-[#EEF2FF] flex flex-col relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#4F46E5]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#7C3AED]/5 rounded-full blur-3xl" />

      {/* 헤더 */}
      <header className="h-16 border-b border-gray-100/50 bg-white/70 backdrop-blur-sm relative z-10">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#4F46E5]/20 group-hover:shadow-xl group-hover:shadow-[#4F46E5]/30 transition-all">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">톡톡리뷰</span>
          </Link>
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="py-6 text-center relative z-10">
        <p className="text-xs text-gray-400">
          © 2025 톡톡리뷰. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
