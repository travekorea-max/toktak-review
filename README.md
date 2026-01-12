# 톡톡리뷰 (TokTak Review)

체험단 리뷰 플랫폼 - 리뷰어와 업체를 연결하는 서비스

## 소개

톡톡리뷰는 업체가 체험단 캠페인을 등록하고, 리뷰어가 제품을 체험한 후 리뷰를 작성하는 플랫폼입니다.

### 주요 기능

**리뷰어**
- 캠페인 탐색 및 신청
- 구매 인증 및 리뷰 제출
- 포인트 적립 및 출금

**업체 (클라이언트)**
- 캠페인 생성 및 관리
- 신청자 선정 및 리뷰 검수
- 결제 및 리포트 확인

**관리자**
- 캠페인/사용자/리뷰 관리
- 결제 및 정산 처리
- 시스템 설정

## 기술 스택

- **Frontend:** Next.js 16, React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Payment:** Toss Payments
- **UI Components:** Radix UI, Lucide Icons

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 페이지
│   ├── client/            # 업체 페이지
│   ├── reviewer/          # 리뷰어 페이지
│   ├── auth/              # 인증 페이지
│   └── api/               # API 라우트
├── components/            # 공통 컴포넌트
├── lib/                   # 유틸리티 및 설정
└── types/                 # TypeScript 타입 정의
```

## 라이선스

Private - All rights reserved
