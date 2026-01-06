'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCircle, Building2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">회원가입</h1>
        <p className="text-gray-600 dark:text-gray-400">
          가입 유형을 선택해주세요
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => router.push('/auth/register/reviewer')}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <UserCircle className="w-16 h-16 text-blue-500" />
            </div>
            <CardTitle>리뷰어 가입</CardTitle>
            <CardDescription>
              체험단 활동으로 포인트 적립
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
              <li>✓ 다양한 제품 무료 체험</li>
              <li>✓ 리뷰 작성 후 포인트 적립</li>
              <li>✓ 포인트 현금 출금 가능</li>
            </ul>
            <Button className="w-full">
              리뷰어로 가입하기
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-purple-500 transition-colors" onClick={() => router.push('/auth/register/client')}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="w-16 h-16 text-purple-500" />
            </div>
            <CardTitle>업체 가입</CardTitle>
            <CardDescription>
              체험단 모집으로 제품 홍보
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
              <li>✓ 제품 체험단 모집 캠페인 등록</li>
              <li>✓ 리뷰어 선정 및 관리</li>
              <li>✓ 리뷰 검수 및 승인</li>
            </ul>
            <Button className="w-full" variant="outline">
              업체로 가입하기
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        이미 계정이 있으신가요?{' '}
        <Link href="/auth/login" className="text-blue-600 hover:underline dark:text-blue-400">
          로그인
        </Link>
      </div>
    </div>
  )
}
