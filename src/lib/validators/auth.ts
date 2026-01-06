import { z } from 'zod'

// 공통 유효성 검사 규칙
const emailSchema = z.string().email('올바른 이메일 주소를 입력해주세요.')
const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .regex(/[a-zA-Z]/, '비밀번호에 영문자가 포함되어야 합니다.')
  .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다.')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, '비밀번호에 특수문자가 포함되어야 합니다.')

const phoneSchema = z
  .string()
  .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 휴대폰 번호를 입력해주세요.')

const businessNumberSchema = z
  .string()
  .regex(/^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$/, '올바른 사업자등록번호를 입력해주세요. (예: 000-00-00000)')

// 로그인 스키마
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// 체험단(리뷰어) 회원가입 스키마
export const reviewerRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: z.string(),
  name: z.string().min(2, '이름을 2자 이상 입력해주세요.'),
  phone: phoneSchema,
  address_zipcode: z.string().optional(),
  address_main: z.string().optional(),
  address_detail: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_holder: z.string().optional(),
  naver_id: z.string().min(1, '네이버 아이디를 입력해주세요.'),
  coupang_id: z.string().min(1, '쿠팡 아이디를 입력해주세요.'),
  instagram_url: z.string().url('올바른 URL을 입력해주세요.').optional().or(z.literal('')),
  blog_url: z.string().url('올바른 URL을 입력해주세요.').optional().or(z.literal('')),
  agreeTerms: z.boolean().refine(val => val === true, '이용약관에 동의해주세요.'),
  agreePrivacy: z.boolean().refine(val => val === true, '개인정보처리방침에 동의해주세요.'),
}).refine(data => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm'],
})

export type ReviewerRegisterFormData = z.infer<typeof reviewerRegisterSchema>

// 클라이언트(광고주) 회원가입 스키마
export const clientRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: z.string(),
  company_name: z.string().min(1, '상호(회사명)를 입력해주세요.'),
  business_number: businessNumberSchema,
  business_type: z.string().optional(),
  business_category: z.string().optional(),
  representative_name: z.string().min(2, '담당자명을 입력해주세요.'),
  phone: phoneSchema,
  address_zipcode: z.string().optional(),
  address_main: z.string().optional(),
  address_detail: z.string().optional(),
  shop_url: z.string().url('올바른 쇼핑몰 URL을 입력해주세요.'),
  shop_platform: z.enum(['smartstore', 'coupang', 'own', 'etc']),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_holder: z.string().optional(),
  tax_email: z.string().email('올바른 이메일 주소를 입력해주세요.').optional().or(z.literal('')),
  agreeTerms: z.boolean().refine(val => val === true, '이용약관에 동의해주세요.'),
  agreePrivacy: z.boolean().refine(val => val === true, '개인정보처리방침에 동의해주세요.'),
}).refine(data => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm'],
})

export type ClientRegisterFormData = z.infer<typeof clientRegisterSchema>

// 비밀번호 재설정 스키마
export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// 비밀번호 변경 스키마
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  newPassword: passwordSchema,
  newPasswordConfirm: z.string(),
}).refine(data => data.newPassword === data.newPasswordConfirm, {
  message: '새 비밀번호가 일치하지 않습니다.',
  path: ['newPasswordConfirm'],
})

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
