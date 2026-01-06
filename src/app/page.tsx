import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Users, TrendingUp, Shield, Zap, Award } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 헤더 */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">톡톡리뷰</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">로그인</Button>
              </Link>
              <Link href="/auth/register">
                <Button>시작하기</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            체험단과 업체를 연결하는
            <br />
            <span className="text-blue-600">스마트한 리뷰 플랫폼</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            네이버 스마트스토어, 쿠팡에서 믿을 수 있는 리뷰를 통해
            <br />
            매출을 올리고 포인트를 받으세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register/reviewer">
              <Button size="lg" className="text-lg px-8 py-6">
                리뷰어로 시작하기
              </Button>
            </Link>
            <Link href="/auth/register/client">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                업체로 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 서비스 소개 */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            누구에게나 윈-윈 서비스
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* 리뷰어용 */}
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-12 w-12 text-blue-600" />
                  <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                    리뷰어
                  </span>
                </div>
                <CardTitle className="text-2xl">상품 체험하고 포인트 받기</CardTitle>
                <CardDescription className="text-base">
                  무료로 상품을 체험하고 솔직한 리뷰를 작성하면 포인트로 보상받으세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>다양한 상품 무료 체험</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>리뷰 작성으로 포인트 적립</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>간편한 출금 시스템</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>네이버, 쿠팡 리뷰 지원</span>
                  </li>
                </ul>
                <Link href="/auth/register/reviewer" className="block mt-6">
                  <Button className="w-full">리뷰어 가입하기</Button>
                </Link>
              </CardContent>
            </Card>

            {/* 업체용 */}
            <Card className="border-2 hover:border-purple-500 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-12 w-12 text-purple-600" />
                  <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                    업체
                  </span>
                </div>
                <CardTitle className="text-2xl">체험단 모집하고 매출 올리기</CardTitle>
                <CardDescription className="text-base">
                  검증된 리뷰어를 통해 신뢰할 수 있는 리뷰를 받고 매출을 증대하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>검증된 리뷰어 매칭</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>간편한 캠페인 관리</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>AI 리뷰 품질 검증</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>투명한 정산 시스템</span>
                  </li>
                </ul>
                <Link href="/auth/register/client" className="block mt-6">
                  <Button className="w-full" variant="outline">업체 가입하기</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 주요 특징 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            톡톡리뷰만의 특징
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">안전한 거래</h3>
              <p className="text-gray-600 dark:text-gray-300">
                구매 인증과 리뷰 검수를 통한 투명한 시스템
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">빠른 매칭</h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI 기반 자동 매칭으로 빠른 캠페인 진행
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">품질 보장</h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI와 수동 검수를 통한 고품질 리뷰 보장
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            리뷰어는 포인트를 받고, 업체는 매출을 올리는 스마트한 플랫폼
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register/reviewer">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                리뷰어 시작하기
              </Button>
            </Link>
            <Link href="/auth/register/client">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50">
                업체 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xl font-bold text-white">톡톡리뷰</span>
          <p className="text-sm mt-2 text-gray-400">
            체험단과 업체를 연결하는 스마트한 리뷰 플랫폼
          </p>
        </div>
      </footer>
    </div>
  )
}
