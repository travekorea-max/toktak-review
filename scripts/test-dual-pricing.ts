/**
 * Dual Pricing 테스트
 */

import {
  calculateCampaignBilling,
  compareBillingByPaymentMethod,
  formatNumber,
} from '../src/lib/billing'

console.log('=== Dual Pricing 테스트 ===\n')

const input = {
  recruitCount: 10,
  rewardPointPerPerson: 30000,
}

// 비교 함수 테스트
const comparison = compareBillingByPaymentMethod(input)

console.log('📊 결제 수단별 금액 비교')
console.log('─'.repeat(50))
console.log(`모집인원: ${input.recruitCount}명`)
console.log(`1인당 포인트: ${formatNumber(input.rewardPointPerPerson)}원`)
console.log('─'.repeat(50))

console.log('\n💳 카드 결제 (정가):')
console.log(`   기본금액: ${formatNumber(comparison.creditCard.baseAmount)}원`)
console.log(`   카드가산(3.5%): +${formatNumber(comparison.creditCard.surchargeAmount)}원`)
console.log(`   공급가액: ${formatNumber(comparison.creditCard.supplyPrice)}원`)
console.log(`   부가세: ${formatNumber(comparison.creditCard.vatAmount)}원`)
console.log(`   ───────────────────`)
console.log(`   총 결제액: ${formatNumber(comparison.creditCard.totalAmount)}원`)

console.log('\n🏦 무통장 입금 (할인):')
console.log(`   기본금액: ${formatNumber(comparison.bankTransfer.baseAmount)}원`)
console.log(`   카드가산: 0원`)
console.log(`   공급가액: ${formatNumber(comparison.bankTransfer.supplyPrice)}원`)
console.log(`   부가세: ${formatNumber(comparison.bankTransfer.vatAmount)}원`)
console.log(`   ───────────────────`)
console.log(`   총 결제액: ${formatNumber(comparison.bankTransfer.totalAmount)}원`)

console.log('\n✨ ' + comparison.message)
console.log(`   (카드 대비 ${comparison.savingsPercent.toFixed(1)}% 할인)`)

// 개별 테스트
console.log('\n\n=== 개별 함수 테스트 ===')

const bankResult = calculateCampaignBilling({
  ...input,
  paymentMethod: 'bank_transfer',
})
console.log('\n무통장 입금:', {
  totalAmount: formatNumber(bankResult.totalAmount) + '원',
  discountFromCard: formatNumber(bankResult.discountFromCard || 0) + '원 할인',
})

const cardResult = calculateCampaignBilling({
  ...input,
  paymentMethod: 'credit_card',
})
console.log('카드 결제:', {
  totalAmount: formatNumber(cardResult.totalAmount) + '원',
  surchargeAmount: formatNumber(cardResult.surchargeAmount) + '원 가산',
})
