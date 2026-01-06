'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { setUser, setReviewerProfile, setClientProfile } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      setIsLoading(true)

      // Supabase 로그인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다')
        return
      }

      if (!authData.user) {
        setError('로그인에 실패했습니다')
        return
      }

      // 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError || !userData) {
        setError('사용자 정보를 가져오는데 실패했습니다')
        return
      }

      setUser(userData)

      // 역할에 따라 프로필 조회
      if (userData.role === 'reviewer') {
        const { data: profile } = await supabase
          .from('reviewer_profiles')
          .select('*')
          .eq('user_id', userData.id)
          .single()

        if (profile) setReviewerProfile(profile)
        router.push('/reviewer/campaigns')
      } else if (userData.role === 'client') {
        const { data: profile } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('user_id', userData.id)
          .single()

        if (profile) setClientProfile(profile)
        router.push('/client/dashboard')
      } else if (userData.role === 'admin') {
        router.push('/admin/dashboard')
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
        <CardDescription className="text-center">
          톡톡리뷰에 오신 것을 환영합니다
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>

          <div className="text-sm text-center text-gray-600 dark:text-gray-400">
            계정이 없으신가요?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline dark:text-blue-400">
              회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
