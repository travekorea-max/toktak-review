'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Settings, CreditCard, Star } from 'lucide-react'

export default function MyPageIndex() {
  const { reviewerProfile } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">마이페이지</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          내 정보를 관리하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>평점</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              {reviewerProfile?.rating.toFixed(1) || '0.0'}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>작성 리뷰</CardDescription>
            <CardTitle className="text-4xl">
              {reviewerProfile?.review_count || 0}건
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>보유 포인트</CardDescription>
            <CardTitle className="text-4xl text-green-600">
              {reviewerProfile?.point_balance.toLocaleString() || 0}원
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/mypage/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>프로필 관리</CardTitle>
                  <CardDescription>기본 정보 및 계좌 정보 수정</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/mypage/account">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>계정 정보</CardTitle>
                  <CardDescription>플랫폼 ID 및 SNS 연결</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/mypage/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>설정</CardTitle>
                  <CardDescription>알림 설정 및 비밀번호 변경</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
