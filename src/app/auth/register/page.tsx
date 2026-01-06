'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Gift, Building2, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="max-w-md mx-auto">
      {/* 타이틀 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
        <p className="text-sm text-gray-500 mt-2">
          가입 유형을 선택해주세요
        </p>
      </div>

      {/* 선택 카드 */}
      <div className="space-y-3">
        {/* 리뷰어 */}
        <button
          onClick={() => router.push('/auth/register/reviewer')}
          className="w-full p-5 bg-white border border-gray-200 rounded-xl text-left hover:border-[#4F46E5] hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#EEF2FF] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#4F46E5] transition-colors">
              <Gift className="w-6 h-6 text-[#4F46E5] group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900">리뷰어</h3>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#4F46E5] transition-colors" />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                무료 체험하고 포인트 받기
              </p>
              <ul className="space-y-1">
                {['다양한 제품 무료 체험', '리뷰당 최대 50,000P', '매주 수요일 출금'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="w-3 h-3 text-[#4F46E5]" />
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
          className="w-full p-5 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-900 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition-colors">
              <Building2 className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900">광고주</h3>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                체험단 모집으로 매출 올리기
              </p>
              <ul className="space-y-1">
                {['50,000+ 검증된 리뷰어', '실시간 캠페인 분석', '2차 콘텐츠 활용'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="w-3 h-3 text-gray-600" />
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
          <Link href="/auth/login" className="text-[#4F46E5] font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
