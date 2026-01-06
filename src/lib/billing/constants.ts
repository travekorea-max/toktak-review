/**
 * 결제/정산 시스템 상수 정의
 */

// 플랫폼 수수료 (변경 가능하도록 설정에서 관리)
export const DEFAULT_AGENCY_FEE_PER_PERSON = 3000 // 1인당 대행 수수료 (원)

// 세금 관련
export const VAT_RATE = 0.1 // 부가가치세율 10%
export const WITHHOLDING_TAX_RATE = 0.033 // 원천징수세율 3.3% (사업소득)

// 결제 수단별 가산율 (Dual Pricing)
export const CARD_SURCHARGE_RATE = 0.035 // 카드 결제 가산율 3.5% (PG 수수료 커버)

// 결제 수단 타입
export type PaymentMethodType = 'bank_transfer' | 'credit_card'

// 출금 관련
export const MIN_WITHDRAWAL_AMOUNT = 10000 // 최소 출금 금액 (원)
export const WITHDRAWAL_FEE = 0 // 출금 수수료 (현재 무료)

// 은행 코드 (추후 PG 연동 시 사용)
export const BANK_CODES = {
  '004': 'KB국민은행',
  '011': 'NH농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '027': '한국씨티은행',
  '031': '대구은행',
  '032': '부산은행',
  '034': '광주은행',
  '035': '제주은행',
  '037': '전북은행',
  '039': '경남은행',
  '045': '새마을금고',
  '048': '신협',
  '071': '우체국',
  '081': 'KEB하나은행',
  '088': '신한은행',
  '089': 'K뱅크',
  '090': '카카오뱅크',
  '092': '토스뱅크',
} as const

export type BankCode = keyof typeof BANK_CODES
