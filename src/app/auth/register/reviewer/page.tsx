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
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle2, ArrowLeft, Gift, Mail, Lock, User, Phone, Sparkles } from 'lucide-react'

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

      await new Promise(resolve => setTimeout(resolve, 1000))

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
    <div className="max-w-md mx-auto">
      {/* 뒤로가기 */}
      <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#4F46E5] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        가입 유형 선택
      </Link>

      {/* 헤더 카드 */}
      <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold mb-1">리뷰어 회원가입</h1>
          <p className="text-white/80 text-sm">
            무료 체험하고 포인트를 받으세요
          </p>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg shadow-gray-200/30 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            이메일 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              className="h-12 pl-10 bg-white border-gray-200 rounded-xl focus:border-[#4F46E5] focus:ring-[#4F46E5]"
              {...register('email')}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              비밀번호 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="최소 6자"
                className="h-12 pl-10 bg-white border-gray-200 rounded-xl"
                {...register('password')}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
              비밀번호 확인 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="비밀번호 확인"
                className="h-12 pl-10 bg-white border-gray-200 rounded-xl"
                {...register('passwordConfirm')}
                disabled={isLoading}
              />
            </div>
            {errors.passwordConfirm && (
              <p className="text-xs text-red-500">{errors.passwordConfirm.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            이름 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              className="h-12 pl-10 bg-white border-gray-200 rounded-xl"
              {...register('name')}
              disabled={isLoading}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            전화번호 <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                className="h-12 pl-10 bg-white border-gray-200 rounded-xl"
                {...register('phone')}
                disabled={isLoading || phoneVerified}
              />
            </div>
            <Button
              type="button"
              variant={phoneVerified ? "default" : "outline"}
              onClick={sendVerificationCode}
              disabled={isLoading || sendingCode || phoneVerified || !phone}
              className={`h-12 px-5 rounded-xl whitespace-nowrap ${phoneVerified ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              {phoneVerified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  완료
                </>
              ) : sendingCode ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : codeSent ? '재발송' : '인증'}
            </Button>
          </div>
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {codeSent && !phoneVerified && (
          <div className="space-y-2">
            <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
              인증번호
            </Label>
            <div className="flex gap-2">
              <Input
                id="verificationCode"
                type="text"
                placeholder="6자리 숫자"
                className="h-12 bg-white border-gray-200 flex-1 rounded-xl"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isLoading || verifyingCode || phoneVerified}
                maxLength={6}
              />
              <Button
                type="button"
                onClick={verifyCode}
                disabled={isLoading || verifyingCode || !verificationCode}
                className="h-12 px-6 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] rounded-xl"
              >
                {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : '확인'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">인증번호는 5분간 유효합니다</p>
          </div>
        )}

        {/* 약관 동의 */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="agreeTerms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setValue('agreeTerms', checked as boolean)}
              disabled={isLoading}
              className="data-[state=checked]:bg-[#4F46E5] data-[state=checked]:border-[#4F46E5]"
            />
            <label htmlFor="agreeTerms" className="text-sm text-gray-600">
              <Link href="#" className="text-[#4F46E5] font-medium hover:underline">이용약관</Link>에 동의합니다 (필수)
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="text-xs text-red-500">{errors.agreeTerms.message}</p>
          )}

          <div className="flex items-center gap-2.5">
            <Checkbox
              id="agreePrivacy"
              checked={agreePrivacy}
              onCheckedChange={(checked) => setValue('agreePrivacy', checked as boolean)}
              disabled={isLoading}
              className="data-[state=checked]:bg-[#4F46E5] data-[state=checked]:border-[#4F46E5]"
            />
            <label htmlFor="agreePrivacy" className="text-sm text-gray-600">
              <Link href="#" className="text-[#4F46E5] font-medium hover:underline">개인정보처리방침</Link>에 동의합니다 (필수)
            </label>
          </div>
          {errors.agreePrivacy && (
            <p className="text-xs text-red-500">{errors.agreePrivacy.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white font-medium rounded-xl shadow-lg shadow-[#4F46E5]/25"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              가입 중...
            </>
          ) : (
            '회원가입'
          )}
        </Button>
      </form>

      {/* 로그인 링크 */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-[#4F46E5] font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
