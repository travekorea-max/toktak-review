/**
 * 결제 모듈 통합 export
 */

export * from './toss'

// 결제 수단 타입
export type PaymentMethod = 'bank_transfer' | 'credit_card'

// 결제 상태 타입
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
