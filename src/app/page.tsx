'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Star,
  Package,
  Users,
  TrendingUp,
  CheckCircle2,
  Zap,
  Shield,
  BarChart3,
  Play,
  Clock,
  Gift,
} from 'lucide-react'

const stats = [
  { value: '50,000+', label: '누적 리뷰어' },
  { value: '12,000+', label: '완료 캠페인' },
  { value: '98%', label: '만족도' },
  { value: '3.2억+', label: '누적 포인트 지급' },
]

const features = [
  {
    icon: Zap,
    title: '빠른 매칭',
    description: '원하는 조건의 리뷰어를 24시간 내 매칭',
  },
  {
    icon: Shield,
    title: '검증된 리뷰어',
    description: '활동 이력과 품질이 검증된 리뷰어만 참여',
  },
  {
    icon: BarChart3,
    title: '실시간 분석',
    description: '캠페인 성과를 실시간으로 확인 및 분석',
  },
]

const steps = [
  { number: '01', title: '캠페인 등록', description: '제품 정보와 조건 입력' },
  { number: '02', title: '리뷰어 선정', description: '지원자 중 리뷰어 선택' },
  { number: '03', title: '제품 배송', description: '선정된 리뷰어에게 발송' },
  { number: '04', title: '리뷰 확인', description: '리뷰 확인 및 승인' },
]

const campaigns = [
  {
    id: '1',
    title: '프리미엄 에어팟 케이스',
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop',
    platform: '네이버',
    reward: 15000,
    price: 29900,
    daysLeft: 3,
  },
  {
    id: '2',
    title: '유기농 그래놀라 세트',
    image: 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?w=400&h=400&fit=crop',
    platform: '쿠팡',
    reward: 12000,
    price: 18900,
    daysLeft: 5,
  },
  {
    id: '3',
    title: '천연 아로마 디퓨저',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
    platform: '네이버',
    reward: 20000,
    price: 35000,
    daysLeft: 2,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">톡톡리뷰</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/reviewer/campaigns" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                캠페인
              </Link>
              <Link href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                서비스
              </Link>
              <Link href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                이용방법
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  로그인
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                  시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] rounded-full text-[#4F46E5] text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full" />
              네이버 · 쿠팡 체험단 플랫폼
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight mb-5">
              진정성 있는 리뷰로
              <br />
              <span className="text-[#4F46E5]">매출을 성장</span>시키세요
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              검증된 리뷰어 풀과 체계적인 캠페인 관리로
              <br />
              효과적인 리뷰 마케팅을 경험하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/register/client">
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] h-11 px-6">
                  광고주로 시작
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/reviewer/campaigns">
                <Button variant="outline" className="h-11 px-6 border-gray-200 text-gray-700 hover:bg-gray-50">
                  캠페인 둘러보기
                </Button>
              </Link>
            </div>

            {/* 간단한 통계 */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-gray-100">
              {stats.slice(0, 3).map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 인기 캠페인 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">인기 캠페인</h2>
              <p className="text-gray-500">지금 가장 인기있는 체험단</p>
            </div>
            <Link href="/reviewer/campaigns" className="text-sm text-[#4F46E5] hover:underline">
              전체보기 →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/reviewer/campaigns/${campaign.id}`}
                className="group block"
              >
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-200">
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <img
                      src={campaign.image}
                      alt={campaign.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium text-gray-700">
                        {campaign.platform}
                      </span>
                      {campaign.daysLeft <= 3 && (
                        <span className="px-2 py-1 bg-red-500 rounded text-xs font-medium text-white">
                          마감임박
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-3 group-hover:text-[#4F46E5] transition-colors">
                      {campaign.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 line-through">{campaign.price.toLocaleString()}원</span>
                        <p className="text-[#4F46E5] font-semibold">무료체험</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">리뷰 포인트</span>
                        <p className="text-emerald-600 font-semibold">+{campaign.reward.toLocaleString()}P</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              왜 톡톡리뷰인가요?
            </h2>
            <p className="text-gray-500">
              검증된 시스템으로 효과적인 리뷰 마케팅을 지원합니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white rounded-xl border border-gray-100 hover:border-[#4F46E5]/20 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 이용방법 */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-white mb-3">
              간단한 4단계
            </h2>
            <p className="text-gray-400">
              복잡한 절차 없이 쉽게 이용하세요
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gray-700 -translate-x-1/2 z-0" />
                )}
                <div className="bg-gray-800/50 rounded-xl p-5 relative z-10">
                  <div className="text-[#818CF8] font-mono text-xs mb-3">{step.number}</div>
                  <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 리뷰어/광고주 선택 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 리뷰어 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-white border border-[#E0E7FF]">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#4F46E5] rounded text-xs font-medium text-white mb-4">
                <Gift className="w-3 h-3" />
                리뷰어
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                체험하고 포인트 받기
              </h3>
              <ul className="space-y-2 mb-6">
                {['무료 상품 체험', '리뷰당 최대 50,000P', '매주 수요일 출금'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-[#4F46E5]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register/reviewer">
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA]">
                  리뷰어 가입
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* 광고주 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-900 rounded text-xs font-medium text-white mb-4">
                <TrendingUp className="w-3 h-3" />
                광고주
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                체험단으로 매출 올리기
              </h3>
              <ul className="space-y-2 mb-6">
                {['50,000+ 검증된 리뷰어', '실시간 캠페인 분석', '2차 콘텐츠 활용'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-gray-900" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register/client">
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                  광고주 가입
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#4F46E5]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-indigo-200 mb-8">
            첫 캠페인 등록 시 서비스 이용료 20% 할인
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register/client">
              <Button className="bg-white text-[#4F46E5] hover:bg-gray-100 h-11 px-6">
                광고주로 시작
              </Button>
            </Link>
            <Link href="/auth/register/reviewer">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-11 px-6">
                리뷰어로 시작
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-12 px-6 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-semibold text-white">톡톡리뷰</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/reviewer/campaigns" className="text-sm text-gray-400 hover:text-white transition-colors">캠페인</Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">이용약관</Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">개인정보처리방침</Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">문의하기</Link>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              © 2025 톡톡리뷰. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
