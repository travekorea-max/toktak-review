'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react'

const resetPasswordSchema = z.object({
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsValidSession(!!session)
    }
    checkSession()
  }, [supabase.auth])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError(null)
      setIsLoading(true)

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setIsSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err) {
      setError('비밀번호 변경 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 세션 확인 중
  if (isValidSession === null) {
    return (
      <div className="max-w-md mx-auto text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5] mx-auto mb-4" />
        <p className="text-sm text-gray-500">확인 중...</p>
      </div>
    )
  }

  // 유효하지 않은 세션
  if (isValidSession === false) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          링크가 만료되었습니다
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.<br />
          다시 비밀번호 찾기를 진행해주세요.
        </p>
        <Link href="/auth/forgot-password">
          <Button className="h-11 bg-[#4F46E5] hover:bg-[#4338CA]">
            비밀번호 찾기
          </Button>
        </Link>
      </div>
    )
  }

  // 성공 화면
  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          비밀번호가 변경되었습니다
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          새로운 비밀번호로 로그인해주세요.<br />
          잠시 후 로그인 페이지로 이동합니다.
        </p>
        <Link href="/auth/login">
          <Button className="h-11 bg-[#4F46E5] hover:bg-[#4338CA]">
            로그인하기
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* 아이콘 */}
      <div className="w-14 h-14 bg-[#EEF2FF] rounded-xl flex items-center justify-center mb-6">
        <Lock className="w-7 h-7 text-[#4F46E5]" />
      </div>

      {/* 타이틀 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">새 비밀번호 설정</h1>
        <p className="text-sm text-gray-500 mt-2">
          사용하실 새 비밀번호를 입력해주세요.
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
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            새 비밀번호
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="최소 6자 이상"
            className="h-11 bg-white border-gray-200"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
            새 비밀번호 확인
          </Label>
          <Input
            id="passwordConfirm"
            type="password"
            placeholder="비밀번호 확인"
            className="h-11 bg-white border-gray-200"
            {...register('passwordConfirm')}
            disabled={isLoading}
          />
          {errors.passwordConfirm && (
            <p className="text-xs text-red-500">{errors.passwordConfirm.message}</p>
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
              변경 중...
            </>
          ) : (
            '비밀번호 변경'
          )}
        </Button>
      </form>
    </div>
  )
}
