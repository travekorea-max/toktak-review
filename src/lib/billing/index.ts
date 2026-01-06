/**
 * 결제 및 정산(Billing & Payout) 시스템
 *
 * @example
 * ```ts
 * import { calculateCampaignBilling, calculatePayout, encrypt } from '@/lib/billing'
 *
 * // 광고주 결제 금액 계산
 * const billing = calculateCampaignBilling({
 *   recruitCount: 10,
 *   rewardPointPerPerson: 30000,
 * })
 *
 * // 리뷰어 출금 실수령액 계산
 * const payout = calculatePayout({ grossAmount: 100000 })
 *
 * // 주민번호 암호화
 * const encrypted = encrypt('900101-1234567')
 * ```
 */

// 상수
export {
  DEFAULT_AGENCY_FEE_PER_PERSON,
  VAT_RATE,
  WITHHOLDING_TAX_RATE,
  CARD_SURCHARGE_RATE,
  MIN_WITHDRAWAL_AMOUNT,
  WITHDRAWAL_FEE,
  BANK_CODES,
  type BankCode,
  type PaymentMethodType,
} from './constants'

// 계산 함수
export {
  // 광고주 결제 (Dual Pricing 지원)
  calculateCampaignBilling,
  calculateCampaignBillingByPlatform,
  compareBillingByPaymentMethod,
  type CampaignBillingInput,
  type CampaignBillingResult,

  // 리뷰어 출금
  calculatePayout,
  calculateRequiredGrossAmount,
  type PayoutInput,
  type PayoutResult,

  // 포맷팅
  formatKRW,
  formatNumber,
  formatPercent,
} from './calculator'

// 암호화
export {
  encrypt,
  decrypt,
  hashRRN,
  validateRRNFormat,
  maskRRN,
  processTaxInfo,
  generateEncryptionKey,
  type TaxInfoInput,
  type TaxInfoResult,
} from './crypto'
