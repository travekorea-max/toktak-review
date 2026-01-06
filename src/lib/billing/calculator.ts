/**
 * 결제/정산 금액 계산 유틸리티
 */

import {
  DEFAULT_AGENCY_FEE_PER_PERSON,
  VAT_RATE,
  WITHHOLDING_TAX_RATE,
  CARD_SURCHARGE_RATE,
  type PaymentMethodType,
} from './constants'

// ============================================================
// 타입 정의
// ============================================================

/** 광고주 결제 금액 계산 결과 (Dual Pricing 지원) */
export interface CampaignBillingResult {
  recruitCount: number         // 모집 인원
  rewardPointPerPerson: number // 1인당 지급 포인트
  agencyFeePerPerson: number   // 1인당 대행 수수료
  rewardPointTotal: number     // 리뷰어 지급 포인트 총액
  agencyFeeTotal: number       // 대행 수수료 총액
  baseAmount: number           // 기본 금액 (가산 전): (P+F)*N
  surchargeRate: number        // 적용된 가산율 (카드: 0.035, 무통장: 0)
  surchargeAmount: number      // 가산 금액 (카드 수수료)
  supplyPrice: number          // 공급가액 (baseAmount + surchargeAmount)
  vatAmount: number            // 부가세
  totalAmount: number          // 최종 결제 금액 (VAT 포함)
  paymentMethod: PaymentMethodType // 결제 수단
  // 할인 표시용 (UI)
  discountFromCard?: number    // 무통장 선택 시 카드 대비 할인액
}

/** 광고주 결제 금액 계산 입력 */
export interface CampaignBillingInput {
  recruitCount: number           // 모집 인원
  rewardPointPerPerson: number   // 1인당 지급 포인트 (제품가격)
  agencyFeePerPerson?: number    // 1인당 대행 수수료 (기본값: 3,000원)
  paymentMethod?: PaymentMethodType // 결제 수단 (기본값: bank_transfer)
  cardSurchargeRate?: number     // 카드 가산율 (기본값: 3.5%)
}

/** 리뷰어 출금 계산 결과 */
export interface PayoutResult {
  grossAmount: number        // 세전 금액 (신청액)
  withholdingTax: number     // 원천징수세액 (3.3%)
  actualPayout: number       // 실수령액
  taxRate: number            // 적용된 세율
}

/** 리뷰어 출금 계산 입력 */
export interface PayoutInput {
  grossAmount: number        // 신청 금액
  taxRate?: number           // 세율 (기본값: 3.3%)
}


// ============================================================
// 광고주 결제 금액 계산 함수
// ============================================================

/**
 * 캠페인 등록 시 광고주가 결제해야 할 총 금액을 계산합니다.
 * Dual Pricing 지원: 무통장 입금 vs 카드 결제
 *
 * @param input - 계산에 필요한 입력값
 * @returns 상세 결제 금액 정보
 *
 * @example
 * ```ts
 * // 무통장 입금 (기본, 할인 적용)
 * const bankBilling = calculateCampaignBilling({
 *   recruitCount: 10,
 *   rewardPointPerPerson: 30000,
 *   paymentMethod: 'bank_transfer',
 * })
 * // totalAmount: 363,000원
 *
 * // 카드 결제 (3.5% 가산)
 * const cardBilling = calculateCampaignBilling({
 *   recruitCount: 10,
 *   rewardPointPerPerson: 30000,
 *   paymentMethod: 'credit_card',
 * })
 * // totalAmount: 375,705원 (12,705원 추가)
 * ```
 */
export function calculateCampaignBilling(
  input: CampaignBillingInput
): CampaignBillingResult {
  const {
    recruitCount,
    rewardPointPerPerson,
    agencyFeePerPerson = DEFAULT_AGENCY_FEE_PER_PERSON,
    paymentMethod = 'bank_transfer',
    cardSurchargeRate = CARD_SURCHARGE_RATE,
  } = input

  // 입력값 검증
  if (recruitCount <= 0) {
    throw new Error('모집 인원은 1명 이상이어야 합니다.')
  }
  if (rewardPointPerPerson <= 0) {
    throw new Error('지급 포인트는 0보다 커야 합니다.')
  }

  // 기본 금액 계산
  const rewardPointTotal = recruitCount * rewardPointPerPerson
  const agencyFeeTotal = recruitCount * agencyFeePerPerson
  const baseAmount = rewardPointTotal + agencyFeeTotal

  // 결제 수단별 가산금액 계산
  let surchargeRate = 0
  let surchargeAmount = 0

  if (paymentMethod === 'credit_card') {
    surchargeRate = cardSurchargeRate
    surchargeAmount = Math.floor(baseAmount * surchargeRate)
  }

  // 공급가액 = 기본금액 + 가산금액
  const supplyPrice = baseAmount + surchargeAmount

  // 부가세 = 공급가액 × 10% (원단위 절사)
  const vatAmount = Math.floor(supplyPrice * VAT_RATE)

  // 최종 결제 금액 = 공급가액 + 부가세
  const totalAmount = supplyPrice + vatAmount

  // 무통장 선택 시 카드 대비 할인액 계산 (UI 표시용)
  let discountFromCard: number | undefined
  if (paymentMethod === 'bank_transfer') {
    const cardSurcharge = Math.floor(baseAmount * cardSurchargeRate)
    const cardSupply = baseAmount + cardSurcharge
    const cardVat = Math.floor(cardSupply * VAT_RATE)
    const cardTotal = cardSupply + cardVat
    discountFromCard = cardTotal - totalAmount
  }

  return {
    recruitCount,
    rewardPointPerPerson,
    agencyFeePerPerson,
    rewardPointTotal,
    agencyFeeTotal,
    baseAmount,
    surchargeRate,
    surchargeAmount,
    supplyPrice,
    vatAmount,
    totalAmount,
    paymentMethod,
    discountFromCard,
  }
}


/**
 * 결제 수단별 금액을 비교합니다 (UI용)
 * "무통장 입금 시 12,705원 할인!" 표시에 사용
 */
export function compareBillingByPaymentMethod(input: Omit<CampaignBillingInput, 'paymentMethod'>) {
  const bankTransfer = calculateCampaignBilling({
    ...input,
    paymentMethod: 'bank_transfer',
  })

  const creditCard = calculateCampaignBilling({
    ...input,
    paymentMethod: 'credit_card',
  })

  const savings = creditCard.totalAmount - bankTransfer.totalAmount
  const savingsPercent = (savings / creditCard.totalAmount) * 100

  return {
    bankTransfer,
    creditCard,
    savings,                              // 무통장 선택 시 절약 금액
    savingsPercent,                       // 절약 퍼센트
    savingsFormatted: formatNumber(savings) + '원', // 표시용
    message: `무통장 입금 시 ${formatNumber(savings)}원 즉시 할인!`,
  }
}


/**
 * 네이버/쿠팡 각각의 결제 금액을 계산합니다 (플랫폼별 모집인원이 다른 경우)
 */
export function calculateCampaignBillingByPlatform(input: {
  naverCount: number
  naverRewardPoint: number
  coupangCount: number
  coupangRewardPoint: number
  agencyFeePerPerson?: number
}): {
  naver: CampaignBillingResult
  coupang: CampaignBillingResult
  combined: CampaignBillingResult
} {
  const agencyFee = input.agencyFeePerPerson ?? DEFAULT_AGENCY_FEE_PER_PERSON

  const naver = calculateCampaignBilling({
    recruitCount: input.naverCount,
    rewardPointPerPerson: input.naverRewardPoint,
    agencyFeePerPerson: agencyFee,
  })

  const coupang = calculateCampaignBilling({
    recruitCount: input.coupangCount,
    rewardPointPerPerson: input.coupangRewardPoint,
    agencyFeePerPerson: agencyFee,
  })

  // 합산
  const totalRecruitCount = input.naverCount + input.coupangCount
  const totalRewardPointTotal = naver.rewardPointTotal + coupang.rewardPointTotal
  const totalAgencyFeeTotal = naver.agencyFeeTotal + coupang.agencyFeeTotal
  const totalSupplyPrice = naver.supplyPrice + coupang.supplyPrice
  const totalVatAmount = Math.floor(totalSupplyPrice * VAT_RATE)
  const totalAmount = totalSupplyPrice + totalVatAmount

  return {
    naver,
    coupang,
    combined: {
      recruitCount: totalRecruitCount,
      rewardPointPerPerson: 0, // 혼합이므로 의미없음
      agencyFeePerPerson: agencyFee,
      rewardPointTotal: totalRewardPointTotal,
      agencyFeeTotal: totalAgencyFeeTotal,
      supplyPrice: totalSupplyPrice,
      vatAmount: totalVatAmount,
      totalAmount,
    },
  }
}


// ============================================================
// 리뷰어 출금 금액 계산 함수
// ============================================================

/**
 * 리뷰어 출금 시 원천징수 후 실수령액을 계산합니다.
 *
 * @param input - 계산에 필요한 입력값
 * @returns 상세 출금 정보
 *
 * @example
 * ```ts
 * const payout = calculatePayout({ grossAmount: 100000 })
 * // 결과:
 * // - grossAmount: 100,000원 (신청액)
 * // - withholdingTax: 3,300원 (3.3%)
 * // - actualPayout: 96,700원 (실수령액)
 * ```
 */
export function calculatePayout(input: PayoutInput): PayoutResult {
  const {
    grossAmount,
    taxRate = WITHHOLDING_TAX_RATE,
  } = input

  // 입력값 검증
  if (grossAmount <= 0) {
    throw new Error('출금 금액은 0보다 커야 합니다.')
  }

  // 원천징수세액 = 신청금액 × 3.3% (원단위 절사)
  const withholdingTax = Math.floor(grossAmount * taxRate)

  // 실수령액 = 신청금액 - 원천징수세액
  const actualPayout = grossAmount - withholdingTax

  return {
    grossAmount,
    withholdingTax,
    actualPayout,
    taxRate,
  }
}


/**
 * 목표 실수령액에서 필요한 신청 금액을 역산합니다.
 *
 * @param targetPayout - 목표 실수령액
 * @param taxRate - 세율 (기본값: 3.3%)
 * @returns 필요한 신청 금액
 *
 * @example
 * ```ts
 * const needed = calculateRequiredGrossAmount(96700)
 * // 결과: 100,000원 (이 금액을 신청하면 96,700원 수령)
 * ```
 */
export function calculateRequiredGrossAmount(
  targetPayout: number,
  taxRate: number = WITHHOLDING_TAX_RATE
): number {
  // 실수령액 = 신청액 × (1 - 세율)
  // 신청액 = 실수령액 / (1 - 세율)
  return Math.ceil(targetPayout / (1 - taxRate))
}


// ============================================================
// 금액 포맷팅 유틸리티
// ============================================================

/**
 * 숫자를 한국 원화 형식으로 포맷합니다.
 */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

/**
 * 숫자를 콤마가 포함된 형식으로 포맷합니다.
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

/**
 * 퍼센트를 포맷합니다.
 */
export function formatPercent(rate: number, decimals: number = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`
}
