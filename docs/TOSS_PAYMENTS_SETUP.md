# 토스페이먼츠 연동 가이드

## 개요

톡톡리뷰 플랫폼의 결제 시스템은 토스페이먼츠 가상계좌를 사용합니다.

### 결제 흐름
```
1. 광고주가 캠페인 결제 요청
2. 서버에서 토스페이먼츠 API로 가상계좌 발급
3. 광고주가 가상계좌로 입금
4. 토스페이먼츠가 웹훅으로 입금 알림
5. 서버에서 자동으로 결제 확인 & 캠페인 활성화
```

## 1. 토스페이먼츠 가입

1. [토스페이먼츠 개발자 센터](https://developers.tosspayments.com/) 접속
2. 사업자 계정으로 가입
3. 테스트 API 키 발급

## 2. 환경변수 설정

`.env.local` 파일에 다음 키를 추가하세요:

```env
# 토스페이먼츠 API 키
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxx
```

### 키 종류
| 키 | 설명 | 사용 위치 |
|----|------|----------|
| `TOSS_SECRET_KEY` | 시크릿 키 (서버용) | 서버 API |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 클라이언트 키 | 프론트엔드 |

### 테스트 키 vs 라이브 키
- 테스트: `test_sk_xxx`, `test_ck_xxx`
- 라이브: `live_sk_xxx`, `live_ck_xxx`

## 3. 데이터베이스 마이그레이션

Supabase SQL Editor에서 다음 파일 실행:

```
supabase/toss-payments-migration.sql
```

이 마이그레이션은:
- `campaign_payments` 테이블에 토스 관련 컬럼 추가
- `payment_logs` 테이블 생성 (웹훅 로그)

## 4. 웹훅 설정

### 토스페이먼츠 대시보드에서 웹훅 URL 등록

1. [토스페이먼츠 개발자 센터](https://developers.tosspayments.com/) 로그인
2. 내 개발정보 → 웹훅 설정
3. 웹훅 URL 등록:
   ```
   https://your-domain.com/api/payments/toss/webhook
   ```

### 등록할 이벤트
- `DEPOSIT_CALLBACK` (가상계좌 입금 알림) - **필수**
- `PAYMENT_STATUS_CHANGED` (결제 상태 변경)

### 로컬 테스트 (ngrok 사용)

```bash
# ngrok 설치 후
ngrok http 3000

# 출력된 URL을 웹훅으로 등록
# https://xxxx.ngrok.io/api/payments/toss/webhook
```

## 5. API 엔드포인트

### 가상계좌 발급
```
POST /api/payments/toss

Body:
{
  "campaignId": "uuid",
  "clientId": "uuid",
  "recruitCount": 10,
  "rewardPointPerPerson": 15000,
  "bank": "04",  // 은행 코드 (기본: 국민은행)
  "customerName": "홍길동",
  "customerEmail": "test@example.com",
  "taxInvoiceEmail": "tax@company.com"
}
```

### 은행 코드
| 코드 | 은행명 |
|------|--------|
| 04 | KB국민은행 |
| 88 | 신한은행 |
| 20 | 우리은행 |
| 81 | 하나은행 |
| 11 | NH농협은행 |
| 03 | IBK기업은행 |
| 90 | 카카오뱅크 |
| 92 | 토스뱅크 |

전체 목록: `src/lib/payments/toss.ts` 참고

### 웹훅 수신
```
POST /api/payments/toss/webhook

토스페이먼츠에서 자동 호출
```

## 6. 개발 모드

토스 API 키가 없으면 자동으로 시뮬레이션 모드로 동작합니다:
- 가상계좌 번호가 자동 생성됨
- `/api/payments/simulate-deposit`으로 입금 테스트 가능

```bash
# 시뮬레이션 테스트
curl -X POST http://localhost:3000/api/payments/simulate-deposit \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "uuid", "depositorName": "테스트"}'
```

## 7. 테스트 체크리스트

- [ ] 환경변수 설정 확인
- [ ] DB 마이그레이션 실행
- [ ] 가상계좌 발급 테스트
- [ ] 웹훅 URL 등록
- [ ] 입금 시뮬레이션 테스트
- [ ] 실제 테스트 입금 (토스 테스트 환경)

## 8. 트러블슈팅

### "토스페이먼츠 설정 누락" 에러
→ `.env.local`에 `TOSS_SECRET_KEY` 확인

### 웹훅이 호출되지 않음
→ 토스 대시보드에서 웹훅 URL 확인
→ HTTPS 필수 (ngrok 사용)

### 금액 불일치 에러
→ 결제 요청 금액과 실제 입금 금액이 다름
→ payment_logs 테이블에서 상세 내역 확인

## 참고 문서

- [토스페이먼츠 가상계좌 가이드](https://docs.tosspayments.com/guides/virtual-account)
- [토스페이먼츠 웹훅 가이드](https://docs.tosspayments.com/guides/webhook)
- [API 레퍼런스](https://docs.tosspayments.com/reference)
