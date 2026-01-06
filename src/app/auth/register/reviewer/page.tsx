'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'

const reviewerRegisterSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다'),
  agreeTerms: z.boolean().refine(val => val === true, '이용약관에 동의해주세요'),
  agreePrivacy: z.boolean().refine(val => val === true, '개인정보처리방침에 동의해주세요'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
})

type ReviewerRegisterFormData = z.infer<typeof reviewerRegisterSchema>

export default function ReviewerRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewerRegisterFormData>({
    resolver: zodResolver(reviewerRegisterSchema),
    defaultValues: {
      agreeTerms: false,
      agreePrivacy: false,
    },
  })

  const agreeTerms = watch('agreeTerms')
  const agreePrivacy = watch('agreePrivacy')
  const phone = watch('phone')

  const sendVerificationCode = async () => {
    if (!phone) {
      setError('전화번호를 입력해주세요')
      return
    }

    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    if (!phoneRegex.test(phone)) {
      setError('올바른 전화번호 형식이 아닙니다')
      return
    }

    try {
      setSendingCode(true)
      setError(null)

      const response = await fetch('/api/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '인증번호 발송에 실패했습니다')
        return
      }

      setCodeSent(true)
      alert('인증번호가 발송되었습니다' + (data.code ? ` (개발모드: ${data.code})` : ''))
    } catch (err) {
      setError('인증번호 발송 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setSendingCode(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode) {
      setError('인증번호를 입력해주세요')
      return
    }

    try {
      setVerifyingCode(true)
      setError(null)

      const response = await fetch('/api/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '인증번호 확인에 실패했습니다')
        return
      }

      setPhoneVerified(true)
      alert('휴대폰 인증이 완료되었습니다')
    } catch (err) {
      setError('인증번호 확인 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setVerifyingCode(false)
    }
  }

  const onSubmit = async (data: ReviewerRegisterFormData) => {
    if (!phoneVerified) {
      setError('휴대폰 인증을 완료해주세요')
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      // Supabase 회원가입 (이메일 확인 없이 자동 확인)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: data.name,
            phone: data.phone,
          }
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError('회원가입에 실패했습니다')
        return
      }

      // users 테이블은 트리거가 자동으로 생성하므로 생략
      // 잠시 대기 (트리거 실행 시간)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // reviewer_profiles 테이블에 프로필 정보 저장
      const { error: profileError } = await supabase
        .from('reviewer_profiles')
        .insert({
          user_id: authData.user.id,
          name: data.name,
          phone: data.phone,
          phone_verified: false,
          rating: 0,
          review_count: 0,
          point_balance: 0,
        })

      if (profileError) {
        console.error('Profile error:', profileError)
        setError('프로필 정보 저장에 실패했습니다: ' + profileError.message)
        return
      }

      // 회원가입 성공 - 바로 로그인 페이지로
      alert('회원가입이 완료되었습니다!')
      router.push('/auth/login')
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">리뷰어 회원가입</CardTitle>
        <CardDescription className="text-center">
          체험단 활동으로 포인트를 적립하세요
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
            <Label htmlFor="email">이메일 *</Label>
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
            <Label htmlFor="password">비밀번호 *</Label>
            <Input
              id="password"
              type="password"
              placeholder="최소 6자 이상"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인 *</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              {...register('passwordConfirm')}
              disabled={isLoading}
            />
            {errors.passwordConfirm && (
              <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">전화번호 *</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                {...register('phone')}
                disabled={isLoading || phoneVerified}
              />
              <Button
                type="button"
                variant="outline"
                onClick={sendVerificationCode}
                disabled={isLoading || sendingCode || phoneVerified || !phone}
                className="whitespace-nowrap"
              >
                {phoneVerified ? '인증완료' : sendingCode ? '발송중...' : codeSent ? '재발송' : '인증번호'}
              </Button>
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {codeSent && !phoneVerified && (
            <div className="space-y-2">
              <Label htmlFor="verificationCode">인증번호 *</Label>
              <div className="flex gap-2">
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="6자리 숫자"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isLoading || verifyingCode || phoneVerified}
                  maxLength={6}
                />
                <Button
                  type="button"
                  onClick={verifyCode}
                  disabled={isLoading || verifyingCode || !verificationCode}
                  className="whitespace-nowrap"
                >
                  {verifyingCode ? '확인중...' : '확인'}
                </Button>
              </div>
              <p className="text-sm text-gray-500">인증번호는 5분간 유효합니다</p>
            </div>
          )}

          {phoneVerified && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">✓ 휴대폰 인증이 완료되었습니다</p>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setValue('agreeTerms', checked as boolean)}
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="agreeTerms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  이용약관 동의 (필수)
                </label>
              </div>
            </div>
            {errors.agreeTerms && (
              <p className="text-sm text-red-500">{errors.agreeTerms.message}</p>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreePrivacy"
                checked={agreePrivacy}
                onCheckedChange={(checked) => setValue('agreePrivacy', checked as boolean)}
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="agreePrivacy"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  개인정보처리방침 동의 (필수)
                </label>
              </div>
            </div>
            {errors.agreePrivacy && (
              <p className="text-sm text-red-500">{errors.agreePrivacy.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '가입 중...' : '회원가입'}
          </Button>

          <div className="text-sm text-center text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
              로그인
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
