/**
 * 토스페이먼츠 연동 모듈
 *
 * 토스페이먼츠 가상계좌 결제 흐름:
 * 1. 클라이언트에서 결제 요청
 * 2. 서버에서 토스 API로 가상계좌 발급 요청
 * 3. 고객이 가상계좌로 입금
 * 4. 토스에서 웹훅으로 입금 알림
 * 5. 서버에서 결제 완료 처리
 *
 * @see https://docs.tosspayments.com/
 */

// 토스페이먼츠 API 기본 URL
const TOSS_API_URL = 'https://api.tosspayments.com/v1'

// 환경변수에서 키 가져오기
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || ''
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''

// Base64 인코딩된 시크릿 키 (Basic Auth용)
const getAuthHeader = () => {
  const encoded = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')
  return `Basic ${encoded}`
}

// 에러 타입
export interface TossError {
  code: string
  message: string
}

// 가상계좌 발급 응답 타입
export interface TossVirtualAccount {
  accountType: string
  accountNumber: string
  bankCode: string
  customerName: string
  dueDate: string
  refundStatus: string
  expired: boolean
  settlementStatus: string
  refundReceiveAccount: null | {
    bankCode: string
    accountNumber: string
    holderName: string
  }
}

// 결제 응답 타입
export interface TossPayment {
  version: string
  paymentKey: string
  type: string
  orderId: string
  orderName: string
  mId: string
  currency: string
  method: string
  totalAmount: number
  balanceAmount: number
  status: string
  requestedAt: string
  approvedAt: string | null
  useEscrow: boolean
  lastTransactionKey: string | null
  suppliedAmount: number
  vat: number
  cultureExpense: boolean
  taxFreeAmount: number
  taxExemptionAmount: number
  cancels: null | any[]
  isPartialCancelable: boolean
  card: null | any
  virtualAccount: TossVirtualAccount | null
  secret: string | null
  transfer: null | any
  receipt: null | any
  checkout: null | any
  easyPay: null | any
  country: string
  failure: null | TossError
  cashReceipt: null | any
  discount: null | any
}

// 은행 코드 매핑
export const BANK_CODES: Record<string, string> = {
  '경남': '39',
  '광주': '34',
  '국민': '04',
  '기업': '03',
  '농협': '11',
  '대구': '31',
  '부산': '32',
  '산업': '02',
  '새마을': '45',
  '수협': '07',
  '신한': '88',
  '신협': '48',
  '우리': '20',
  '우체국': '71',
  '저축': '50',
  '전북': '37',
  '제주': '35',
  '카카오': '90',
  '케이': '89',
  '토스': '92',
  '하나': '81',
  'SC': '23',
  '씨티': '27',
}

// 은행 코드 → 이름 역매핑
export const BANK_NAMES: Record<string, string> = {
  '39': '경남은행',
  '34': '광주은행',
  '04': 'KB국민은행',
  '03': 'IBK기업은행',
  '11': 'NH농협은행',
  '31': 'DGB대구은행',
  '32': 'BNK부산은행',
  '02': 'KDB산업은행',
  '45': '새마을금고',
  '07': 'Sh수협은행',
  '88': '신한은행',
  '48': '신협',
  '20': '우리은행',
  '71': '우체국',
  '50': '저축은행',
  '37': '전북은행',
  '35': '제주은행',
  '90': '카카오뱅크',
  '89': '케이뱅크',
  '92': '토스뱅크',
  '81': '하나은행',
  '23': 'SC제일은행',
  '27': '한국씨티은행',
}

/**
 * 가상계좌 결제 요청
 * 토스페이먼츠에 가상계좌 발급을 요청합니다.
 */
export async function requestVirtualAccount(params: {
  orderId: string           // 주문 ID (우리 시스템의 payment ID)
  orderName: string         // 주문명 (캠페인명)
  amount: number            // 결제 금액
  customerName: string      // 고객명 (업체명)
  customerEmail?: string    // 고객 이메일
  bank: string              // 은행 코드 (예: '04' = 국민은행)
  validHours?: number       // 입금 유효 시간 (기본 72시간)
}): Promise<{ success: true; payment: TossPayment } | { success: false; error: TossError }> {
  try {
    // 입금 기한 계산 (기본 72시간)
    const validHours = params.validHours || 72
    const dueDate = new Date()
    dueDate.setHours(dueDate.getHours() + validHours)

    const response = await fetch(`${TOSS_API_URL}/virtual-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        orderId: params.orderId,
        orderName: params.orderName,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        bank: params.bank,
        validHours,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.code || 'UNKNOWN_ERROR',
          message: data.message || '결제 요청 중 오류가 발생했습니다',
        },
      }
    }

    return { success: true, payment: data }
  } catch (error) {
    console.error('Toss API error:', error)
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '토스페이먼츠 연결에 실패했습니다',
      },
    }
  }
}

/**
 * 결제 조회
 * paymentKey로 결제 정보를 조회합니다.
 */
export async function getPayment(paymentKey: string): Promise<TossPayment | null> {
  try {
    const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
      headers: {
        'Authorization': getAuthHeader(),
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Toss getPayment error:', error)
    return null
  }
}

/**
 * 결제 취소
 */
export async function cancelPayment(params: {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number  // 부분 취소 시
}): Promise<{ success: true; payment: TossPayment } | { success: false; error: TossError }> {
  try {
    const response = await fetch(`${TOSS_API_URL}/payments/${params.paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason: params.cancelReason,
        cancelAmount: params.cancelAmount,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.code || 'UNKNOWN_ERROR',
          message: data.message || '취소 요청 중 오류가 발생했습니다',
        },
      }
    }

    return { success: true, payment: data }
  } catch (error) {
    console.error('Toss cancel error:', error)
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '토스페이먼츠 연결에 실패했습니다',
      },
    }
  }
}

/**
 * 웹훅 서명 검증
 * 토스페이먼츠에서 보낸 웹훅인지 검증합니다.
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', TOSS_SECRET_KEY)
    .update(payload)
    .digest('base64')
  return signature === expectedSignature
}

/**
 * 토스페이먼츠 웹훅 데이터 파싱
 */
export interface TossWebhookData {
  eventType: 'PAYMENT_STATUS_CHANGED' | 'DEPOSIT_CALLBACK'
  createdAt: string
  data: {
    paymentKey: string
    orderId: string
    status: string
    transactionKey?: string
    secret?: string
  }
}

/**
 * 가상계좌 입금 완료 웹훅 데이터
 */
export interface TossDepositCallback {
  createdAt: string
  secret: string
  status: string
  transactionKey: string
  orderId: string
}

/**
 * 설정 확인
 */
export function checkConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  if (!TOSS_SECRET_KEY) missing.push('TOSS_SECRET_KEY')
  if (!TOSS_CLIENT_KEY) missing.push('NEXT_PUBLIC_TOSS_CLIENT_KEY')

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * 클라이언트 키 반환 (프론트엔드용)
 */
export function getClientKey(): string {
  return TOSS_CLIENT_KEY
}
