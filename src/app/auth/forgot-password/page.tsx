'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null)
      setIsLoading(true)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      )

      if (resetError) {
        setError(resetError.message)
        return
      }

      setIsSuccess(true)
    } catch (err) {
      setError('비밀번호 재설정 요청 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          이메일을 확인해주세요
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          비밀번호 재설정 링크가 이메일로 발송되었습니다.<br />
          이메일을 확인하시고 링크를 클릭해주세요.
        </p>
        <Link href="/auth/login">
          <Button variant="outline" className="h-11">
            <ArrowLeft className="w-4 h-4 mr-2" />
            로그인으로 돌아가기
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* 뒤로가기 */}
      <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        로그인
      </Link>

      {/* 아이콘 */}
      <div className="w-14 h-14 bg-[#EEF2FF] rounded-xl flex items-center justify-center mb-6">
        <Mail className="w-7 h-7 text-[#4F46E5]" />
      </div>

      {/* 타이틀 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h1>
        <p className="text-sm text-gray-500 mt-2">
          가입하신 이메일 주소를 입력해주세요.<br />
          비밀번호 재설정 링크를 보내드립니다.
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
            className="h-11 bg-white border-gray-200"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
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
              발송 중...
            </>
          ) : (
            '재설정 링크 발송'
          )}
        </Button>
      </form>

      {/* 로그인 링크 */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          비밀번호가 기억나셨나요?{' '}
          <Link href="/auth/login" className="text-[#4F46E5] font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
