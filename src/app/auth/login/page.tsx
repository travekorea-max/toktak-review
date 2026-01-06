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
import { Loader2 } from 'lucide-react'

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
    <div>
      {/* 타이틀 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
        <p className="text-sm text-gray-500 mt-2">
          톡톡리뷰에 오신 것을 환영합니다
        </p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            이메일
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            className="h-11 bg-white border-gray-200 focus:border-[#4F46E5] focus:ring-[#4F46E5]"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              비밀번호
            </Label>
            <Link href="/auth/forgot-password" className="text-xs text-gray-500 hover:text-[#4F46E5]">
              비밀번호 찾기
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-11 bg-white border-gray-200 focus:border-[#4F46E5] focus:ring-[#4F46E5]"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </Button>
      </form>

      {/* 구분선 */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4 bg-[#FAFBFC] text-gray-400">또는</span>
        </div>
      </div>

      {/* 회원가입 링크 */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          아직 계정이 없으신가요?{' '}
          <Link href="/auth/register" className="text-[#4F46E5] font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
