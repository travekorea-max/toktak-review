'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Gift, Building2, ArrowRight, CheckCircle2, Sparkles, Star } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="max-w-md mx-auto">
      {/* 타이틀 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#4F46E5]/10 to-[#7C3AED]/10 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span className="text-xs font-medium text-[#4F46E5]">Join Us</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
        <p className="text-sm text-gray-500 mt-2">
          가입 유형을 선택해주세요
        </p>
      </div>

      {/* 선택 카드 */}
      <div className="space-y-4">
        {/* 리뷰어 */}
        <button
          onClick={() => router.push('/auth/register/reviewer')}
          className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-transparent rounded-2xl text-left hover:border-[#4F46E5] hover:shadow-xl hover:shadow-[#4F46E5]/10 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4F46E5]/10 to-[#7C3AED]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start gap-4 relative">
            <div className="w-14 h-14 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#4F46E5]/25 group-hover:scale-105 transition-transform">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-lg">리뷰어</h3>
                  <span className="px-2 py-0.5 bg-[#4F46E5]/10 rounded-full text-xs font-medium text-[#4F46E5]">인기</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#4F46E5] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                무료 체험하고 포인트 받기
              </p>
              <ul className="space-y-2">
                {['다양한 제품 무료 체험', '리뷰당 최대 50,000P', '매주 수요일 출금'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[#4F46E5]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </button>

        {/* 업체 */}
        <button
          onClick={() => router.push('/auth/register/client')}
          className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-transparent rounded-2xl text-left hover:border-gray-900 hover:shadow-xl transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-200/50 to-gray-100/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start gap-4 relative">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-gray-900/25 group-hover:scale-105 transition-transform">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-lg">광고주</h3>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                체험단 모집으로 매출 올리기
              </p>
              <ul className="space-y-2">
                {['50,000+ 검증된 리뷰어', '실시간 캠페인 분석', '2차 콘텐츠 활용'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-gray-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </button>
      </div>

      {/* 로그인 링크 */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-[#4F46E5] font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
