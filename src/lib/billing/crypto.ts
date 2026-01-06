/**
 * 주민등록번호(RRN) 암호화/복호화 유틸리티
 *
 * AES-256-GCM 암호화를 사용하여 개인정보를 안전하게 보호합니다.
 * - 암호화 키는 환경변수(ENCRYPTION_KEY)에서 로드
 * - 각 암호화마다 고유한 IV(Initialization Vector) 사용
 * - GCM 모드로 무결성 검증 포함
 */

import crypto from 'crypto'

// ============================================================
// 상수 정의
// ============================================================

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

// ============================================================
// 암호화 키 관리
// ============================================================

/**
 * 환경변수에서 암호화 키를 로드합니다.
 * 키가 없으면 에러를 발생시킵니다.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY 환경변수가 설정되지 않았습니다. ' +
      '.env.local에 32바이트(64자 hex) 키를 설정하세요.'
    )
  }

  // hex 문자열을 Buffer로 변환
  const keyBuffer = Buffer.from(key, 'hex')

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `암호화 키는 ${KEY_LENGTH}바이트(${KEY_LENGTH * 2}자 hex)여야 합니다. ` +
      `현재: ${keyBuffer.length}바이트`
    )
  }

  return keyBuffer
}

/**
 * 새로운 암호화 키를 생성합니다 (초기 설정용).
 * 콘솔에서 실행: npx tsx -e "require('./src/lib/billing/crypto').generateEncryptionKey()"
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH).toString('hex')
  console.log('Generated Encryption Key (save to .env.local):')
  console.log(`ENCRYPTION_KEY=${key}`)
  return key
}


// ============================================================
// 암호화/복호화 함수
// ============================================================

/**
 * 문자열을 AES-256-GCM으로 암호화합니다.
 *
 * @param plaintext - 암호화할 평문
 * @returns Base64 인코딩된 암호문 (IV + 암호문 + AuthTag 포함)
 *
 * @example
 * ```ts
 * const encrypted = encrypt('900101-1234567')
 * // 결과: "base64_encoded_string..."
 * ```
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()

  // 랜덤 IV 생성 (각 암호화마다 고유)
  const iv = crypto.randomBytes(IV_LENGTH)

  // 암호화
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])

  // AuthTag (무결성 검증용)
  const authTag = cipher.getAuthTag()

  // IV + 암호문 + AuthTag를 하나의 버퍼로 결합
  const combined = Buffer.concat([iv, encrypted, authTag])

  // Base64로 인코딩하여 반환
  return combined.toString('base64')
}


/**
 * AES-256-GCM으로 암호화된 문자열을 복호화합니다.
 *
 * @param ciphertext - Base64 인코딩된 암호문
 * @returns 복호화된 평문
 *
 * @throws 복호화 실패 시 에러 발생 (키 불일치, 데이터 변조 등)
 *
 * @example
 * ```ts
 * const decrypted = decrypt("base64_encoded_string...")
 * // 결과: "900101-1234567"
 * ```
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey()

  // Base64 디코딩
  const combined = Buffer.from(ciphertext, 'base64')

  // IV, 암호문, AuthTag 분리
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH)

  // 복호화
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}


// ============================================================
// 해시 함수 (중복 체크용)
// ============================================================

/**
 * 주민등록번호의 SHA-256 해시를 생성합니다.
 * 중복 등록 방지를 위한 검색용 해시입니다.
 *
 * @param rrn - 주민등록번호 (하이픈 포함 또는 미포함)
 * @returns SHA-256 해시 (hex)
 */
export function hashRRN(rrn: string): string {
  // 하이픈 제거 후 해시
  const normalized = rrn.replace(/-/g, '')
  return crypto.createHash('sha256').update(normalized).digest('hex')
}


// ============================================================
// 주민등록번호 유효성 검증
// ============================================================

/**
 * 주민등록번호 형식을 검증합니다.
 *
 * @param rrn - 주민등록번호 (하이픈 포함 또는 미포함)
 * @returns 유효 여부
 */
export function validateRRNFormat(rrn: string): boolean {
  // 하이픈 제거
  const normalized = rrn.replace(/-/g, '')

  // 13자리 숫자인지 확인
  if (!/^\d{13}$/.test(normalized)) {
    return false
  }

  // 생년월일 검증 (YYMMDD)
  const year = parseInt(normalized.substring(0, 2))
  const month = parseInt(normalized.substring(2, 4))
  const day = parseInt(normalized.substring(4, 6))

  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  // 성별 코드 검증 (1,2,3,4)
  const genderCode = parseInt(normalized.charAt(6))
  if (![1, 2, 3, 4].includes(genderCode)) return false

  // 체크섬 검증 (주민등록번호 검증 알고리즘)
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
  let sum = 0

  for (let i = 0; i < 12; i++) {
    sum += parseInt(normalized.charAt(i)) * weights[i]
  }

  const checkDigit = (11 - (sum % 11)) % 10
  const lastDigit = parseInt(normalized.charAt(12))

  return checkDigit === lastDigit
}


/**
 * 주민등록번호를 마스킹하여 반환합니다.
 * 보안상 앞 6자리만 표시합니다.
 *
 * @param rrn - 주민등록번호
 * @returns 마스킹된 주민등록번호 (예: "900101-*******")
 */
export function maskRRN(rrn: string): string {
  const normalized = rrn.replace(/-/g, '')
  if (normalized.length !== 13) {
    return '******-*******'
  }
  return `${normalized.substring(0, 6)}-*******`
}


// ============================================================
// 세무정보 처리 통합 함수
// ============================================================

export interface TaxInfoInput {
  rrn: string      // 주민등록번호
  legalName: string // 법적 실명
}

export interface TaxInfoResult {
  encryptedRrn: string  // 암호화된 주민번호
  rrnHash: string       // 해시 (중복 체크용)
  legalName: string     // 법적 실명
  maskedRrn: string     // 마스킹된 주민번호 (표시용)
}

/**
 * 세무정보 등록을 위해 주민번호를 처리합니다.
 *
 * @param input - 세무정보 입력
 * @returns 암호화/해시된 세무정보
 */
export function processTaxInfo(input: TaxInfoInput): TaxInfoResult {
  // 유효성 검증
  if (!validateRRNFormat(input.rrn)) {
    throw new Error('유효하지 않은 주민등록번호입니다.')
  }

  if (!input.legalName || input.legalName.trim().length < 2) {
    throw new Error('실명을 정확히 입력해주세요.')
  }

  return {
    encryptedRrn: encrypt(input.rrn),
    rrnHash: hashRRN(input.rrn),
    legalName: input.legalName.trim(),
    maskedRrn: maskRRN(input.rrn),
  }
}
