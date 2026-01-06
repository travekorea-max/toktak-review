# 톡톡리뷰 (TokTok Review)

네이버/쿠팡 리뷰 캠페인 매칭 플랫폼

## 프로젝트 개요

톡톡리뷰는 업체와 리뷰어를 연결하여 네이버 스마트스토어 및 쿠팡 상품 리뷰를 관리하는 플랫폼입니다.

### 주요 기능

- **리뷰어**: 캠페인 신청, 구매 인증, 리뷰 작성, 포인트 관리
- **업체**: 캠페인 생성, 지원자 관리, 리뷰 확인
- **관리자**: 캠페인 승인, 사용자 관리, 리뷰 검수

## 기술 스택

- **Frontend**: Next.js 16.1.1 (App Router), TypeScript, Tailwind CSS 4.0
- **Backend**: Supabase (Auth, Database, Storage)
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Form Validation**: React Hook Form + Zod
- **Data Fetching**: TanStack Query

## 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 Supabase 정보를 입력하세요:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase 데이터베이스 설정
1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. SQL Editor에서 `supabase/auth-sync.sql` 실행

**자세한 설정 방법은 [SETUP_GUIDE.md](./SETUP_GUIDE.md)를 참조하세요.**

### 4. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 애플리케이션을 확인할 수 있습니다.

## 프로젝트 구조

```
toktak-review/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── admin/              # 관리자 페이지
│   │   ├── auth/               # 인증 페이지 (로그인, 회원가입)
│   │   ├── client/             # 업체 페이지
│   │   └── reviewer/           # 리뷰어 페이지
│   ├── components/             # 재사용 컴포넌트
│   │   ├── campaigns/          # 캠페인 관련 컴포넌트
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   └── ui/                 # shadcn/ui 컴포넌트
│   ├── lib/                    # 라이브러리 및 유틸리티
│   │   └── supabase/           # Supabase 클라이언트
│   ├── stores/                 # Zustand 상태 관리
│   └── types/                  # TypeScript 타입 정의
├── supabase/                   # Supabase 스키마 및 마이그레이션
│   ├── schema.sql              # 데이터베이스 스키마
│   └── auth-sync.sql           # Auth 연동 및 Storage 설정
└── public/                     # 정적 파일
```

## 사용자 역할

### 리뷰어 (Reviewer)
- 캠페인 목록 조회 및 신청
- 선정 후 상품 구매 및 인증
- 리뷰 작성 및 제출
- 포인트 적립 및 출금

### 업체 (Client)
- 캠페인 생성 및 관리
- 지원자 선정 및 관리
- 리뷰 확인 및 정산

### 관리자 (Admin)
- 캠페인 승인/거절
- 사용자 관리
- 리뷰 검수 및 승인
- 시스템 전체 모니터링

## 데이터베이스 스키마

### 주요 테이블
- `users`: 사용자 기본 정보
- `reviewer_profiles`: 리뷰어 프로필
- `client_profiles`: 업체 프로필
- `campaigns`: 캠페인 정보
- `applications`: 캠페인 지원 내역
- `purchase_verifications`: 구매 인증
- `review_submissions`: 리뷰 제출
- `point_transactions`: 포인트 거래 내역
- `withdrawal_requests`: 출금 요청

자세한 스키마는 `supabase/schema.sql`을 참조하세요.

## 보안

### Row Level Security (RLS)
모든 테이블에 RLS 정책이 적용되어 있습니다:
- 사용자는 자신의 데이터만 조회/수정 가능
- 관리자는 모든 데이터 접근 가능
- 역할 기반 접근 제어 (RBAC)

### 인증
- Supabase Auth를 사용한 이메일/비밀번호 인증
- JWT 토큰 기반 세션 관리
- Middleware를 통한 라우트 보호

## 개발 가이드

### 새로운 페이지 추가
1. `src/app/[role]/` 디렉토리에 페이지 추가
2. 필요한 경우 레이아웃의 네비게이션 링크 업데이트
3. RLS 정책 확인 및 추가

### 새로운 컴포넌트 추가
1. `src/components/`에 컴포넌트 생성
2. TypeScript 타입 정의
3. 재사용성을 고려한 props 설계

### 데이터베이스 스키마 변경
1. `supabase/schema.sql` 수정
2. Supabase SQL Editor에서 마이그레이션 실행
3. `src/types/database.ts` 타입 업데이트

## 배포

### Vercel 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 프로덕션 배포
vercel --prod
```

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
